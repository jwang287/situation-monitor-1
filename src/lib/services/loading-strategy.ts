/**
 * 分阶段加载策略 - 优先显示核心内容，提升首屏加载速度
 */

import { browser } from '$app/environment';

export type LoadPhase = 'critical' | 'important' | 'background';

export interface LoadTask {
	name: string;
	phase: LoadPhase;
	loader: () => Promise<void>;
	timeout: number;
	onError?: (error: Error) => void;
}

interface LoadResult {
	task: LoadTask;
	success: boolean;
	duration: number;
	error?: Error;
}

/**
 * 分阶段加载管理器
 * 按优先级分批次加载数据，提升用户体验
 */
export class LoadingStrategy {
	private tasks: LoadTask[] = [];
	private results: LoadResult[] = [];
	private abortControllers = new Map<string, AbortController>();

	/**
	 * 添加加载任务
	 */
	addTask(task: LoadTask): void {
		this.tasks.push(task);
	}

	/**
	 * 执行分阶段加载
	 * @param onPhaseComplete 每阶段完成回调
	 * @param onProgress 进度回调 (completed, total)
	 */
	async execute(
		onPhaseComplete?: (phase: LoadPhase, results: LoadResult[]) => void,
		onProgress?: (completed: number, total: number) => void
	): Promise<LoadResult[]> {
		const phases: LoadPhase[] = ['critical', 'important', 'background'];
		const totalTasks = this.tasks.length;
		let completedTasks = 0;

		for (const phase of phases) {
			const phaseTasks = this.tasks.filter((t) => t.phase === phase);

			if (phaseTasks.length === 0) continue;

			console.log(`[LoadingStrategy] Starting ${phase} phase with ${phaseTasks.length} tasks`);

			// 同一阶段并行执行，但各自有超时控制
			const phaseResults = await Promise.all(
				phaseTasks.map(async (task) => {
					const result = await this.runWithTimeout(task);
					completedTasks++;
					onProgress?.(completedTasks, totalTasks);
					return result;
				})
			);

			this.results.push(...phaseResults);
			onPhaseComplete?.(phase, phaseResults);

			// 阶段间短暂延迟，让UI有机会渲染
			if (phase !== 'background') {
				await this.delay(50);
			}
		}

		return this.results;
	}

	/**
	 * 获取当前时间戳 (浏览器环境使用 performance，Node环境使用 Date)
	 */
	private getNow(): number {
		if (browser && typeof performance !== 'undefined') {
			return performance.now();
		}
		return Date.now();
	}

	/**
	 * 带超时的任务执行
	 */
	private async runWithTimeout(task: LoadTask): Promise<LoadResult> {
		const startTime = this.getNow();
		const controller = new AbortController();
		this.abortControllers.set(task.name, controller);

		const timeoutId = setTimeout(() => {
			controller.abort();
			console.warn(`[LoadingStrategy] Task "${task.name}" timed out after ${task.timeout}ms`);
		}, task.timeout);

		try {
			// 创建可中断的 Promise
			const abortablePromise = new Promise<void>((resolve, reject) => {
				// 监听取消信号
				controller.signal.addEventListener('abort', () => {
					reject(new Error(`Task "${task.name}" was aborted`));
				});

				// 执行任务
				task
					.loader()
					.then(() => resolve())
					.catch((error) => reject(error));
			});

			await abortablePromise;
			clearTimeout(timeoutId);

			const duration = this.getNow() - startTime;
			console.log(`[LoadingStrategy] Task "${task.name}" completed in ${duration.toFixed(0)}ms`);

			return {
				task,
				success: true,
				duration
			};
		} catch (error) {
			clearTimeout(timeoutId);
			const duration = this.getNow() - startTime;
			const err = error instanceof Error ? error : new Error(String(error));

			console.error(`[LoadingStrategy] Task "${task.name}" failed after ${duration.toFixed(0)}ms:`, err.message);

			// 调用错误处理回调
			task.onError?.(err);

			return {
				task,
				success: false,
				duration,
				error: err
			};
		} finally {
			this.abortControllers.delete(task.name);
		}
	}

	/**
	 * 取消所有进行中的任务
	 */
	abortAll(): void {
		console.log('[LoadingStrategy] Aborting all tasks');
		this.abortControllers.forEach((controller, name) => {
			controller.abort();
			console.log(`[LoadingStrategy] Aborted task: ${name}`);
		});
		this.abortControllers.clear();
	}

	/**
	 * 获取加载统计
	 */
	getStats(): {
		total: number;
		success: number;
		failed: number;
		byPhase: Record<LoadPhase, { success: number; failed: number }>;
	} {
		const byPhase: Record<LoadPhase, { success: number; failed: number }> = {
			critical: { success: 0, failed: 0 },
			important: { success: 0, failed: 0 },
			background: { success: 0, failed: 0 }
		};

		this.results.forEach((result) => {
			if (result.success) {
				byPhase[result.task.phase].success++;
			} else {
				byPhase[result.task.phase].failed++;
			}
		});

		return {
			total: this.results.length,
			success: this.results.filter((r) => r.success).length,
			failed: this.results.filter((r) => !r.success).length,
			byPhase
		};
	}

	/**
	 * 延迟辅助函数
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * 重置状态
	 */
	reset(): void {
		this.tasks = [];
		this.results = [];
		this.abortControllers.clear();
	}
}

/**
 * 创建默认的加载策略实例
 */
export function createLoadingStrategy(): LoadingStrategy {
	return new LoadingStrategy();
}

/**
 * 预定义的加载超时配置
 */
export const LoadTimeouts = {
	/** 关键数据 - 2秒超时 */
	CRITICAL: 2000,
	/** 重要数据 - 5秒超时 */
	IMPORTANT: 5000,
	/** 背景数据 - 10秒超时 */
	BACKGROUND: 10000,
	/** API请求 - 3秒超时 */
	API_REQUEST: 3000,
	/** 外部资源 - 8秒超时 */
	EXTERNAL_RESOURCE: 8000
} as const;
