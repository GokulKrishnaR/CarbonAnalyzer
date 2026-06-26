import { EMISSION_FACTORS, REGIONAL_ELECTRICITY_FACTORS } from "./emissionFactors";

export interface UserInputs {
  // Transport
  carDistance: number; // km/week
  carType: "petrol" | "diesel" | "electric" | "none";
  publicTransitDistance: number; // km/week
  flightHours: number; // hours/year
  rideShareTrips: number; // trips/week

  // Energy
  electricityUsage: number; // kWh/month
  electricityRegion: string; // Region code (GLOBAL, US, EU, etc.)
  cookingLpg: number; // kg/month
  acHeatingHours: number; // hours/day

  // Diet
  beefMeals: number; // meals/week
  chickenMeals: number; // meals/week
  vegMeals: number; // meals/week
  veganDays: number; // days/week
  foodWaste: number; // kg/week

  // Consumption
  clothingItems: number; // items/month
  electronicsItems: number; // items/year
  shoppingLevel: "low" | "medium" | "high";

  // Waste
  wasteAmount: number; // kg/week
  recyclePercent: number; // 0 - 100
  compost: boolean;

  // Lifestyle
  deviceHours: number; // hours/day
  travelLevel: "low" | "medium" | "high";
  
  // Goals
  monthlyGoal: number; // kg CO2e/month
}

export const DEFAULT_INPUTS: UserInputs = {
  carDistance: 120,
  carType: "petrol",
  publicTransitDistance: 40,
  flightHours: 5,
  rideShareTrips: 2,
  electricityUsage: 250,
  electricityRegion: "GLOBAL",
  cookingLpg: 14,
  acHeatingHours: 4,
  beefMeals: 2,
  chickenMeals: 4,
  vegMeals: 12,
  veganDays: 1,
  foodWaste: 2,
  clothingItems: 2,
  electronicsItems: 1,
  shoppingLevel: "medium",
  wasteAmount: 7,
  recyclePercent: 30,
  compost: false,
  deviceHours: 6,
  travelLevel: "medium",
  monthlyGoal: 300,
};

export interface CarbonBreakdown {
  transport: number;
  energy: number;
  food: number;
  consumption: number;
  waste: number;
  lifestyle: number;
  total: number;
}

export interface CalculationResults {
  monthly: CarbonBreakdown;
  yearly: CarbonBreakdown;
  daily: CarbonBreakdown;
  ecoScore: number; // 0 - 100
  comparisonPercentage: number; // positive = more than average, negative = less
  biggestContributor: {
    category: keyof Omit<CarbonBreakdown, "total">;
    label: string;
    value: number;
    percentage: number;
  };
}

export function calculateCarbonFootprint(inputs: UserInputs): CalculationResults {
  const weeksPerMonth = 52 / 12; // ~4.33

  // 1. TRANSPORT CALCULATIONS (kg CO2e per month)
  let carFactor = 0;
  if (inputs.carType === "petrol") carFactor = EMISSION_FACTORS.transport.carPetrol;
  else if (inputs.carType === "diesel") carFactor = EMISSION_FACTORS.transport.carDiesel;
  else if (inputs.carType === "electric") carFactor = EMISSION_FACTORS.transport.carElectric;

  const carCO2 = inputs.carDistance * weeksPerMonth * carFactor;
  
  // Public transit is blended bus & train factor
  const publicTransitFactor = (EMISSION_FACTORS.transport.bus + EMISSION_FACTORS.transport.train) / 2;
  const publicTransitCO2 = inputs.publicTransitDistance * weeksPerMonth * publicTransitFactor;
  
  const flightCO2 = (inputs.flightHours / 12) * EMISSION_FACTORS.transport.flightPerHour;
  
  // Assume average ride share trip is 8 km
  const rideShareDistance = inputs.rideShareTrips * 8;
  const rideShareCO2 = rideShareDistance * weeksPerMonth * EMISSION_FACTORS.transport.rideSharePerKm;

  // Travel level multiplier adjustments
  const travelMultiplier = EMISSION_FACTORS.lifestyle.travelFreqMultiplier[inputs.travelLevel];
  const rawTransportTotal = carCO2 + publicTransitCO2 + flightCO2 + rideShareCO2;
  const transportTotal = rawTransportTotal * travelMultiplier;

  // 2. ENERGY CALCULATIONS (kg CO2e per month)
  const regionObj = REGIONAL_ELECTRICITY_FACTORS.find(r => r.code === inputs.electricityRegion) 
    || REGIONAL_ELECTRICITY_FACTORS[0];
  const electricityFactor = regionObj.factor;

  const electricityCO2 = inputs.electricityUsage * electricityFactor;
  const lpgCO2 = inputs.cookingLpg * EMISSION_FACTORS.energy.lpgPerKg;
  
  // AC/Heating uses electricity multiplier
  const acHeatingUsageKwh = inputs.acHeatingHours * 30 * EMISSION_FACTORS.energy.heatingCoolingKw;
  const acHeatingCO2 = acHeatingUsageKwh * electricityFactor;

  const energyTotal = electricityCO2 + lpgCO2 + acHeatingCO2;

  // 3. DIET CALCULATIONS (kg CO2e per month)
  // Define footprint per meal type
  const beefMealCO2 = EMISSION_FACTORS.food.beef * 0.15; // 150g meat portion
  const chickenMealCO2 = EMISSION_FACTORS.food.chicken * 0.15; // 150g chicken portion
  const vegMealCO2 = (EMISSION_FACTORS.food.vegetables * 0.20) + (EMISSION_FACTORS.food.rice * 0.10); // Veg + rice
  const veganMealCO2 = EMISSION_FACTORS.food.vegetables * 0.25;

  // A full week has 21 meals
  const specifiedMeals = inputs.beefMeals + inputs.chickenMeals + inputs.vegMeals + (inputs.veganDays * 3);
  const remainingMeals = Math.max(0, 21 - specifiedMeals);

  const beefCO2Weekly = inputs.beefMeals * beefMealCO2;
  const chickenCO2Weekly = inputs.chickenMeals * chickenMealCO2;
  const vegCO2Weekly = inputs.vegMeals * vegMealCO2;
  const veganCO2Weekly = (inputs.veganDays * 3) * veganMealCO2;
  const defaultMealsCO2Weekly = remainingMeals * vegMealCO2; // default remaining to standard veg meals

  const mealsCO2Weekly = beefCO2Weekly + chickenCO2Weekly + vegCO2Weekly + veganCO2Weekly + defaultMealsCO2Weekly;

  // Food waste is metric waste + production footprint multiplier (~2.0 kg carbon per kg wasted food)
  const foodWasteCO2Weekly = inputs.foodWaste * (EMISSION_FACTORS.waste.landfillPerKg + 2.0);

  const foodTotal = (mealsCO2Weekly + foodWasteCO2Weekly) * weeksPerMonth;

  // 4. CONSUMPTION CALCULATIONS (kg CO2e per month)
  const clothingCO2 = inputs.clothingItems * EMISSION_FACTORS.consumption.clothingPerItem;
  const electronicsCO2 = (inputs.electronicsItems / 12) * EMISSION_FACTORS.consumption.electronicsPerItem;
  const generalShoppingCO2 = EMISSION_FACTORS.consumption.shoppingFrequency[inputs.shoppingLevel];

  const consumptionTotal = clothingCO2 + electronicsCO2 + generalShoppingCO2;

  // 5. WASTE CALCULATIONS (kg CO2e per month)
  const rawWasteMonthly = inputs.wasteAmount * weeksPerMonth;
  const landfillCO2 = rawWasteMonthly * EMISSION_FACTORS.waste.landfillPerKg;
  
  // Recycling reduces footprint
  const recycledAmount = rawWasteMonthly * (inputs.recyclePercent / 100);
  const recycleSavings = recycledAmount * EMISSION_FACTORS.waste.recycleSavingsPerKg; // Negative factor
  
  // Composting organic waste savings
  const compostSavings = inputs.compost 
    ? (rawWasteMonthly * 0.3 * EMISSION_FACTORS.waste.compostSavingsPerKg) // Assumes 30% organic composted
    : 0;

  const wasteTotal = Math.max(0, landfillCO2 + recycleSavings + compostSavings);

  // 6. LIFESTYLE SIGNALS (kg CO2e per month)
  const deviceCO2 = inputs.deviceHours * 30 * EMISSION_FACTORS.lifestyle.deviceHour;
  const lifestyleTotal = deviceCO2;

  // TOTALS
  const totalMonthly = transportTotal + energyTotal + foodTotal + consumptionTotal + wasteTotal + lifestyleTotal;

  const monthly: CarbonBreakdown = {
    transport: Math.round(transportTotal),
    energy: Math.round(energyTotal),
    food: Math.round(foodTotal),
    consumption: Math.round(consumptionTotal),
    waste: Math.round(wasteTotal),
    lifestyle: Math.round(lifestyleTotal),
    total: Math.round(totalMonthly),
  };

  const yearly: CarbonBreakdown = {
    transport: Math.round(transportTotal * 12),
    energy: Math.round(energyTotal * 12),
    food: Math.round(foodTotal * 12),
    consumption: Math.round(consumptionTotal * 12),
    waste: Math.round(wasteTotal * 12),
    lifestyle: Math.round(lifestyleTotal * 12),
    total: Math.round(totalMonthly * 12),
  };

  const daily: CarbonBreakdown = {
    transport: Number((transportTotal / 30).toFixed(2)),
    energy: Number((energyTotal / 30).toFixed(2)),
    food: Number((foodTotal / 30).toFixed(2)),
    consumption: Number((consumptionTotal / 30).toFixed(2)),
    waste: Number((wasteTotal / 30).toFixed(2)),
    lifestyle: Number((lifestyleTotal / 30).toFixed(2)),
    total: Number((totalMonthly / 30).toFixed(2)),
  };

  // Eco Score calculation (exponential decay)
  const yearlyTons = (totalMonthly * 12) / 1000;
  const ecoScore = Math.max(
    0,
    Math.min(100, Math.round(100 * Math.exp(-yearly.total / 8000))) // Score decays down based on 8 tons scale
  );

  // Global baseline comparison
  // Global average is ~4.5 tons/year, which is 4500 kg
  const comparisonPercentage = Math.round(((yearly.total - 4500) / 4500) * 100);

  // Find biggest contributing category
  const categories: { key: keyof Omit<CarbonBreakdown, "total">; label: string; value: number }[] = [
    { key: "transport", label: "Transport", value: monthly.transport },
    { key: "energy", label: "Home Energy", value: monthly.energy },
    { key: "food", label: "Diet & Food", value: monthly.food },
    { key: "consumption", label: "Consumption & Shopping", value: monthly.consumption },
    { key: "waste", label: "Waste Management", value: monthly.waste },
    { key: "lifestyle", label: "Digital Lifestyle", value: monthly.lifestyle },
  ];

  const sortedCategories = [...categories].sort((a, b) => b.value - a.value);
  const topCategory = sortedCategories[0];
  const percentage = totalMonthly > 0 ? Math.round((topCategory.value / totalMonthly) * 100) : 0;

  const biggestContributor = {
    category: topCategory.key,
    label: topCategory.label,
    value: topCategory.value,
    percentage: percentage,
  };

  return {
    monthly,
    yearly,
    daily,
    ecoScore,
    comparisonPercentage,
    biggestContributor,
  };
}
