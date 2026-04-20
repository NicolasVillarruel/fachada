import { format, differenceInDays, addDays, isBefore, isAfter, startOfDay, parseISO } from 'date-fns';

export interface DailySnapshot {
  date: string;
  actual?: number;
  expected?: number;
  projected?: number;
}

export interface AnalyticsResult {
  timeline: DailySnapshot[];
  velocity: number; // % per day
  estimatedCompletion: Date | null;
  deviationDays: number; // + for delay, - for ahead
  currentProgress: number;
  expectedProgressToday: number;
  startDate: Date;
  deliveryDate: Date;
}

export function calculateProjectAnalytics(
  project: any,
  modules: any[],
  logs: any[]
): AnalyticsResult {
  const startDate = startOfDay(parseISO(project.start_date || new Date().toISOString()));
  const deliveryDate = startOfDay(parseISO(project.delivery_date || new Date().toISOString()));
  const today = startOfDay(new Date());

  const totalModules = modules.length;
  if (totalModules === 0) {
    return {
      timeline: [],
      velocity: 0,
      estimatedCompletion: null,
      deviationDays: 0,
      currentProgress: 0,
      expectedProgressToday: 0,
      startDate,
      deliveryDate
    };
  }

  // 1. Reconstruct History up to today
  const daysSinceStart = Math.max(0, differenceInDays(today, startDate));
  const totalDaysPlanned = differenceInDays(deliveryDate, startDate) || 1;

  // We group logs by date for efficient lookup
  const logsByDate: Record<string, any[]> = {};
  logs.forEach(log => {
    const dateStr = format(parseISO(log.changed_at), 'yyyy-MM-dd');
    if (!logsByDate[dateStr]) logsByDate[dateStr] = [];
    logsByDate[dateStr].push(log);
  });

  // Track state of each module as we go forward in time
  const moduleStates: Record<string, string> = {};
  modules.forEach(m => {
     moduleStates[m.id] = 'PENDING';
  });

  // To properly reconstruct, we need logs sorted by time
  const sortedLogs = [...logs].sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());

  let currentActualProgress = 0;

  // Calculate actual progress up to today to establish velocity
  for (let i = 0; i <= daysSinceStart; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    // Update module states with logs from this day
    sortedLogs.forEach(log => {
      const logDate = startOfDay(parseISO(log.changed_at));
      if (format(logDate, 'yyyy-MM-dd') === dateStr) {
        moduleStates[log.module_id] = log.new_status;
      }
    });

    if (i === daysSinceStart) {
      // For the current day, use the actual real-time status as the ground truth
      let currentWeightedSum = 0;
      modules.forEach(m => {
        if (m.status === 'COMPLETED') currentWeightedSum += 1;
        else if (m.status === 'IN_PROGRESS') currentWeightedSum += 0.5;
      });
      currentActualProgress = Math.round((currentWeightedSum / totalModules) * 100);
    } else {
      let weightedSum = 0;
      Object.values(moduleStates).forEach(status => {
        if (status === 'COMPLETED') weightedSum += 1;
        else if (status === 'IN_PROGRESS') weightedSum += 0.5;
      });
      currentActualProgress = Math.round((weightedSum / totalModules) * 100);
    }
  }

  const currentProgress = currentActualProgress;
  const velocity = daysSinceStart > 0 ? currentProgress / daysSinceStart : 0;

  let estimatedCompletion = null;
  let deviationDays = 0;
  let daysToEstimate = 0;

  if (velocity > 0 && currentProgress < 100) {
    const remainingProgress = 100 - currentProgress;
    daysToEstimate = Math.ceil(remainingProgress / velocity);
    estimatedCompletion = addDays(today, daysToEstimate);
    deviationDays = differenceInDays(estimatedCompletion, deliveryDate);
  } else if (currentProgress >= 100) {
    estimatedCompletion = today;
    deviationDays = differenceInDays(today, deliveryDate);
  }

  // 2. Build full timeline up to the max date (today, delivery, or estimated)
  const timeline: DailySnapshot[] = [];
  const lastTimelineDate = new Date(Math.max(
    today.getTime(),
    deliveryDate.getTime(),
    estimatedCompletion ? estimatedCompletion.getTime() : 0
  ));
  
  const totalTimelineDays = Math.max(0, differenceInDays(lastTimelineDate, startDate));
  
  // Reset module states to simulate actual progress again for the timeline
  Object.keys(moduleStates).forEach(k => moduleStates[k] = 'PENDING');

  for (let i = 0; i <= totalTimelineDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    const expectedProgress = Math.min(100, Math.round((i / totalDaysPlanned) * 100));
    
    let actualProgress: number | undefined = undefined;
    let projectedProgress: number | undefined = undefined;

    if (i <= daysSinceStart) {
      // Calculate actual progress for past days
      sortedLogs.forEach(log => {
        const logDate = startOfDay(parseISO(log.changed_at));
        if (format(logDate, 'yyyy-MM-dd') === dateStr) {
          moduleStates[log.module_id] = log.new_status;
        }
      });

      if (i === daysSinceStart) {
        actualProgress = currentProgress;
        projectedProgress = currentProgress; // Start projection from today's actual
      } else {
        let weightedSum = 0;
        Object.values(moduleStates).forEach(status => {
          if (status === 'COMPLETED') weightedSum += 1;
          else if (status === 'IN_PROGRESS') weightedSum += 0.5;
        });
        actualProgress = Math.round((weightedSum / totalModules) * 100);
      }
    } else {
      // Future dates
      if (estimatedCompletion && isBefore(currentDate, estimatedCompletion) || currentDate.getTime() === estimatedCompletion?.getTime()) {
        const daysFromToday = differenceInDays(currentDate, today);
        projectedProgress = Math.min(100, Math.round(currentProgress + (daysFromToday * velocity)));
      } else if (estimatedCompletion && isAfter(currentDate, estimatedCompletion)) {
        projectedProgress = 100;
      }
    }

    timeline.push({
      date: dateStr,
      actual: actualProgress,
      expected: expectedProgress,
      projected: projectedProgress
    });
  }

  const expectedProgressToday = Math.min(100, Math.round((daysSinceStart / totalDaysPlanned) * 100));

  return {
    timeline,
    velocity,
    estimatedCompletion,
    deviationDays,
    currentProgress,
    expectedProgressToday,
    startDate,
    deliveryDate
  };
}
