import { CarbonBreakdown, CalculationResults } from "./carbonCalculator";
import { OPTIMUM_MONTHLY_KG } from "./carbonConstants";

export interface MonthlySimulationPoint {
  name: string;
  monthIndex: number;
  currentLifestyle: number;
  optimizedTarget: number | null;
  budgetGoal: number;
  optimumGoal: number;
  monthlyCurrent: number;
  monthlyOptimized: number | null;
}

/** Northern-hemisphere seasonal multipliers (energy HVAC, transport travel) */
const SEASONAL_ENERGY: number[] = [1.22, 1.18, 1.02, 0.88, 0.92, 1.14, 1.28, 1.24, 0.94, 0.9, 1.06, 1.14];
const SEASONAL_TRANSPORT: number[] = [0.96, 0.96, 1.0, 1.02, 1.04, 1.06, 1.12, 1.1, 1.0, 1.0, 1.04, 1.16];
/** Extra flight hours spread across peak travel months */
const FLIGHT_MONTH_SHARE = [0.05, 0.05, 0.07, 0.08, 0.09, 0.12, 0.14, 0.12, 0.08, 0.07, 0.06, 0.07];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getRollingMonthLabels(startMonthIndex: number): string[] {
  return Array.from({ length: 12 }, (_, i) => MONTH_LABELS[(startMonthIndex + i) % 12]);
}

function seasonalMonthlyTotal(
  monthly: CarbonBreakdown,
  flightHoursPerYear: number,
  monthIdx: number
): number {
  const flightMonthlyBase = flightHoursPerYear > 0 ? monthly.transport * 0.35 : 0;
  const nonFlightTransport = Math.max(0, monthly.transport - flightMonthlyBase);
  const flightThisMonth = flightMonthlyBase * (FLIGHT_MONTH_SHARE[monthIdx] / 0.09);

  const adjustedTransport =
    nonFlightTransport * SEASONAL_TRANSPORT[monthIdx] + flightThisMonth;
  const adjustedEnergy = monthly.energy * SEASONAL_ENERGY[monthIdx];

  const staticCategories =
    monthly.food +
    monthly.consumption +
    monthly.waste +
    monthly.lifestyle;

  return Math.round(
    adjustedTransport + adjustedEnergy + staticCategories
  );
}

/** Ease-out adoption curve: changes ramp up over the year */
function adoptionFactor(monthIndex: number): number {
  const t = monthIndex / 12;
  return t * (2 - t);
}

export function buildTwelveMonthSimulation(
  results: CalculationResults,
  budgetMonthly: number,
  flightHoursPerYear: number,
  optimizedMonthly?: number
): MonthlySimulationPoint[] {
  const startMonth = new Date().getMonth();
  const labels = getRollingMonthLabels(startMonth);

  const currentMonthlyRates = Array.from({ length: 12 }, (_, i) => {
    const calendarMonthIdx = (startMonth + i) % 12;
    return seasonalMonthlyTotal(results.monthly, flightHoursPerYear, calendarMonthIdx);
  });

  const hasOptimized = optimizedMonthly !== undefined && optimizedMonthly > 0;
  const optimizedScale =
    results.monthly.total > 0 && hasOptimized
      ? optimizedMonthly / results.monthly.total
      : 1;

  const optimizedMonthlyRates = hasOptimized
    ? currentMonthlyRates.map((rate) => Math.round(rate * optimizedScale))
    : null;

  let cumulativeCurrent = 0;
  let cumulativeOptimized = 0;
  let cumulativeBudget = 0;
  let cumulativeOptimum = 0;

  return labels.map((name, i) => {
    const monthIndex = i + 1;
    const monthlyCurrent = currentMonthlyRates[i];
    cumulativeCurrent += monthlyCurrent;
    cumulativeBudget += budgetMonthly;
    cumulativeOptimum += OPTIMUM_MONTHLY_KG;

    let monthlyOptimized: number | null = null;
    if (optimizedMonthlyRates) {
      const adoption = adoptionFactor(monthIndex);
      monthlyOptimized = Math.round(
        monthlyCurrent * (1 - adoption) + optimizedMonthlyRates[i] * adoption
      );
      cumulativeOptimized += monthlyOptimized;
    }

    return {
      name,
      monthIndex,
      currentLifestyle: cumulativeCurrent,
      optimizedTarget: optimizedMonthlyRates ? cumulativeOptimized : null,
      budgetGoal: cumulativeBudget,
      optimumGoal: cumulativeOptimum,
      monthlyCurrent,
      monthlyOptimized,
    };
  });
}
