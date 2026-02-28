/**
 * Settings store - panel visibility, order, sizes, and translation settings
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import {
	PANELS,
	NON_DRAGGABLE_PANELS,
	PRESETS,
	ONBOARDING_STORAGE_KEY,
	PRESET_STORAGE_KEY,
	type PanelId
} from '$lib/config';

// Storage keys
const STORAGE_KEYS = {
	panels: 'situationMonitorPanels',
	order: 'panelOrder',
	sizes: 'panelSizes',
	translation: 'situationMonitorTranslation',
	translationProvider: 'situationMonitorTranslationProvider',
	microsoftKey: 'situationMonitorMicrosoftKey',
	googleKey: 'situationMonitorGoogleKey',
	newsRegion: 'situationMonitorNewsRegion'
} as const;

// Translation provider types
export type TranslationProvider = 'microsoft' | 'google' | 'libretranslate' | 'auto';

// News region types
export type NewsRegion = 'china' | 'international';

// Types
export interface PanelSettings {
	enabled: Record<PanelId, boolean>;
	order: PanelId[];
	sizes: Record<PanelId, { width?: number; height?: number }>;
}

export interface TranslationSettings {
	enableTranslation: boolean;
	translationProvider: TranslationProvider;
	microsoftApiKey: string;
	googleApiKey: string;
	newsRegion: NewsRegion;
}

export interface SettingsState extends PanelSettings, TranslationSettings {
	initialized: boolean;
}

// Default settings
function getDefaultSettings(): PanelSettings {
	const allPanelIds = Object.keys(PANELS) as PanelId[];

	return {
		enabled: Object.fromEntries(allPanelIds.map((id) => [id, true])) as Record<PanelId, boolean>,
		order: allPanelIds,
		sizes: {} as Record<PanelId, { width?: number; height?: number }>
	};
}

// Load from localStorage
function loadFromStorage(): Partial<PanelSettings & TranslationSettings> {
	if (!browser) return {};

	try {
		const panels = localStorage.getItem(STORAGE_KEYS.panels);
		const order = localStorage.getItem(STORAGE_KEYS.order);
		const sizes = localStorage.getItem(STORAGE_KEYS.sizes);
		const translation = localStorage.getItem(STORAGE_KEYS.translation);
		const translationProvider = localStorage.getItem(STORAGE_KEYS.translationProvider);
		const microsoftKey = localStorage.getItem(STORAGE_KEYS.microsoftKey);
		const googleKey = localStorage.getItem(STORAGE_KEYS.googleKey);
		const newsRegion = localStorage.getItem(STORAGE_KEYS.newsRegion);

		return {
			enabled: panels ? JSON.parse(panels) : undefined,
			order: order ? JSON.parse(order) : undefined,
			sizes: sizes ? JSON.parse(sizes) : undefined,
			enableTranslation: translation ? JSON.parse(translation) : undefined,
			translationProvider: translationProvider as TranslationProvider || undefined,
			microsoftApiKey: microsoftKey || '',
			googleApiKey: googleKey || '',
			newsRegion: (newsRegion as NewsRegion) || 'international'
		};
	} catch (e) {
		console.warn('Failed to load settings from localStorage:', e);
		return {};
	}
}

// Save to localStorage
function saveToStorage(key: keyof typeof STORAGE_KEYS, value: unknown): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
	} catch (e) {
		console.warn(`Failed to save ${key} to localStorage:`, e);
	}
}

// Create the store
function createSettingsStore() {
	const defaults = getDefaultSettings();
	const saved = loadFromStorage();

	const initialState: SettingsState = {
		enabled: { ...defaults.enabled, ...saved.enabled },
		order: saved.order ?? defaults.order,
		sizes: { ...defaults.sizes, ...saved.sizes },
		enableTranslation: saved.enableTranslation ?? false,
		translationProvider: saved.translationProvider ?? 'auto',
		microsoftApiKey: saved.microsoftApiKey ?? '',
		googleApiKey: saved.googleApiKey ?? '',
		newsRegion: saved.newsRegion ?? 'international',
		initialized: false
	};

	const { subscribe, set, update } = writable<SettingsState>(initialState);

	return {
		subscribe,

		/**
		 * Initialize store (call after hydration)
		 */
		init() {
			update((state) => ({ ...state, initialized: true }));
		},

		/**
		 * Check if a panel is enabled
		 */
		isPanelEnabled(panelId: PanelId): boolean {
			const state = get({ subscribe });
			return state.enabled[panelId] ?? true;
		},

		/**
		 * Toggle panel visibility
		 */
		togglePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = {
					...state.enabled,
					[panelId]: !state.enabled[panelId]
				};
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Enable a specific panel
		 */
		enablePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = { ...state.enabled, [panelId]: true };
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Disable a specific panel
		 */
		disablePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = { ...state.enabled, [panelId]: false };
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Update panel order (for drag-drop)
		 */
		updateOrder(newOrder: PanelId[]) {
			update((state) => {
				saveToStorage('order', newOrder);
				return { ...state, order: newOrder };
			});
		},

		/**
		 * Move a panel to a new position
		 */
		movePanel(panelId: PanelId, toIndex: number) {
			// Don't allow moving non-draggable panels
			if (NON_DRAGGABLE_PANELS.includes(panelId)) return;

			update((state) => {
				const currentIndex = state.order.indexOf(panelId);
				if (currentIndex === -1) return state;

				const newOrder = [...state.order];
				newOrder.splice(currentIndex, 1);
				newOrder.splice(toIndex, 0, panelId);

				saveToStorage('order', newOrder);
				return { ...state, order: newOrder };
			});
		},

		/**
		 * Update panel size
		 */
		updateSize(panelId: PanelId, size: { width?: number; height?: number }) {
			update((state) => {
				const newSizes = {
					...state.sizes,
					[panelId]: { ...state.sizes[panelId], ...size }
				};
				saveToStorage('sizes', newSizes);
				return { ...state, sizes: newSizes };
			});
		},

		/**
		 * Toggle translation feature
		 */
		toggleTranslation() {
			update((state) => {
				const newValue = !state.enableTranslation;
				saveToStorage('translation', newValue);
				return { ...state, enableTranslation: newValue };
			});
		},

		/**
		 * Set translation enabled state
		 */
		setTranslationEnabled(enabled: boolean) {
			update((state) => {
				saveToStorage('translation', enabled);
				return { ...state, enableTranslation: enabled };
			});
		},

		/**
		 * Set translation provider
		 */
		setTranslationProvider(provider: TranslationProvider) {
			update((state) => {
				saveToStorage('translationProvider', provider);
				return { ...state, translationProvider: provider };
			});
		},

		/**
		 * Set Microsoft Translator API Key
		 */
		setMicrosoftApiKey(key: string) {
			update((state) => {
				saveToStorage('microsoftKey', key);
				return { ...state, microsoftApiKey: key };
			});
		},

		/**
		 * Set Google Translate API Key
		 */
		setGoogleApiKey(key: string) {
			update((state) => {
				saveToStorage('googleKey', key);
				return { ...state, googleApiKey: key };
			});
		},

		/**
		 * Set news region (china or international)
		 */
		setNewsRegion(region: NewsRegion) {
			update((state) => {
				saveToStorage('newsRegion', region);
				return { ...state, newsRegion: region };
			});
		},

		/**
		 * Reset all settings to defaults
		 */
		reset() {
			const defaults = getDefaultSettings();
			if (browser) {
				localStorage.removeItem(STORAGE_KEYS.panels);
				localStorage.removeItem(STORAGE_KEYS.order);
				localStorage.removeItem(STORAGE_KEYS.sizes);
				localStorage.removeItem(STORAGE_KEYS.translation);
				localStorage.removeItem(STORAGE_KEYS.translationProvider);
				localStorage.removeItem(STORAGE_KEYS.microsoftKey);
				localStorage.removeItem(STORAGE_KEYS.googleKey);
				localStorage.removeItem(STORAGE_KEYS.newsRegion);
			}
			set({
				...defaults,
				enableTranslation: false,
				translationProvider: 'auto',
				microsoftApiKey: '',
				googleApiKey: '',
				newsRegion: 'international',
				initialized: true
			});
		},

		/**
		 * Get panel size
		 */
		getPanelSize(panelId: PanelId): { width?: number; height?: number } | undefined {
			const state = get({ subscribe });
			return state.sizes[panelId];
		},

		/**
		 * Check if onboarding is complete
		 */
		isOnboardingComplete(): boolean {
			if (!browser) return true;
			return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
		},

		/**
		 * Get selected preset
		 */
		getSelectedPreset(): string | null {
			if (!browser) return null;
			return localStorage.getItem(PRESET_STORAGE_KEY);
		},

		/**
		 * Apply a preset configuration
		 */
		applyPreset(presetId: string) {
			const preset = PRESETS[presetId];
			if (!preset) {
				console.error('Unknown preset:', presetId);
				return;
			}

			// Build panel settings - disable all panels first, then enable preset panels
			const allPanelIds = Object.keys(PANELS) as PanelId[];
			const newEnabled = Object.fromEntries(
				allPanelIds.map((id) => [id, preset.panels.includes(id)])
			) as Record<PanelId, boolean>;

			update((state) => {
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});

			// Mark onboarding complete and save preset
			if (browser) {
				localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
				localStorage.setItem(PRESET_STORAGE_KEY, presetId);
			}
		},

		/**
		 * Reset onboarding to show modal again
		 */
		resetOnboarding() {
			if (browser) {
				localStorage.removeItem(ONBOARDING_STORAGE_KEY);
				localStorage.removeItem(PRESET_STORAGE_KEY);
			}
		}
	};
}

// Export singleton store
export const settings = createSettingsStore();

// Derived stores for convenience
export const enabledPanels = derived(settings, ($settings) =>
	$settings.order.filter((id) => $settings.enabled[id])
);

export const disabledPanels = derived(settings, ($settings) =>
	$settings.order.filter((id) => !$settings.enabled[id])
);

export const draggablePanels = derived(enabledPanels, ($enabled) =>
	$enabled.filter((id) => !NON_DRAGGABLE_PANELS.includes(id))
);
