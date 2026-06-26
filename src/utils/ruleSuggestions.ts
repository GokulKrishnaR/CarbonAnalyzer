import { UserInputs } from "./carbonCalculator";
import { EMISSION_FACTORS, REGIONAL_ELECTRICITY_FACTORS } from "./emissionFactors";

export interface SuggestionItem {
  id: string;
  category: "transport" | "energy" | "food" | "consumption" | "waste" | "lifestyle";
  title: string;
  description: string;
  savings: number; // kg CO2e per month saved
  actionLabel: string;
}

export function getRuleSuggestions(inputs: UserInputs): SuggestionItem[] {
  const suggestions: SuggestionItem[] = [];
  const weeksPerMonth = 52 / 12;

  // Region factor for energy savings
  const regionObj = REGIONAL_ELECTRICITY_FACTORS.find(r => r.code === inputs.electricityRegion) 
    || REGIONAL_ELECTRICITY_FACTORS[0];
  const electricityFactor = regionObj.factor;

  // 1. TRANSPORT SUGGESTIONS
  let carFactor = 0;
  if (inputs.carType === "petrol") carFactor = EMISSION_FACTORS.transport.carPetrol;
  else if (inputs.carType === "diesel") carFactor = EMISSION_FACTORS.transport.carDiesel;
  else if (inputs.carType === "electric") carFactor = EMISSION_FACTORS.transport.carElectric;

  if ((inputs.carType === "petrol" || inputs.carType === "diesel") && inputs.carDistance > 50) {
    const shiftKms = Math.min(50, Math.round(inputs.carDistance * 0.3)); // Shift 30% of driving (max 50km) to transit
    const publicTransitFactor = (EMISSION_FACTORS.transport.bus + EMISSION_FACTORS.transport.train) / 2;
    const savings = Math.round(shiftKms * weeksPerMonth * (carFactor - publicTransitFactor));
    
    if (savings > 2) {
      suggestions.push({
        id: "transport_shift_transit",
        category: "transport",
        title: "Shift 30% of car trips to public transit",
        description: `Swap ~${shiftKms} km of weekly driving for bus or train. You'll significantly reduce emissions and save on fuel.`,
        savings,
        actionLabel: `Commute ${shiftKms} km/week via transit`,
      });
    }
  }

  if ((inputs.carType === "petrol" || inputs.carType === "diesel") && inputs.carDistance > 0) {
    const savings = Math.round(inputs.carDistance * weeksPerMonth * (carFactor - EMISSION_FACTORS.transport.carElectric));
    if (savings > 5) {
      suggestions.push({
        id: "transport_switch_electric",
        category: "transport",
        title: "Transition to an electric vehicle (EV)",
        description: "Switching from a fossil-fuel car to an electric vehicle reduces driving emissions by over 70% based on average power grids.",
        savings,
        actionLabel: "Switch to Electric Car",
      });
    }
  }

  if (inputs.flightHours > 10) {
    const flightSavings = Math.round(2 * EMISSION_FACTORS.transport.flightPerHour / 12); // Reduce 2 hours of flight per year
    suggestions.push({
      id: "transport_reduce_flights",
      category: "transport",
      title: "Reduce annual flying by 2 hours",
      description: "Flights have a high immediate greenhouse effect. Shifting 1-2 flights to high-speed rail or replacing business trips with video calls yields major savings.",
      savings: flightSavings,
      actionLabel: "Reduce flight time by 2 hrs/year",
    });
  }

  // 2. ENERGY SUGGESTIONS
  if (inputs.electricityUsage > 120) {
    const savings = Math.round(inputs.electricityUsage * 0.15 * electricityFactor); // 15% energy efficiency
    if (savings > 1) {
      suggestions.push({
        id: "energy_led_efficiency",
        category: "energy",
        title: "Improve home energy efficiency by 15%",
        description: "Switch to LED lightbulbs, unplug idle electronics, and buy Energy Star rated appliances to trim your baseline power draw.",
        savings,
        actionLabel: "Improve home efficiency",
      });
    }
  }

  if (inputs.acHeatingHours > 2) {
    const reducedHours = 1; // Reduce by 1 hour/day
    const savings = Math.round(reducedHours * 30 * EMISSION_FACTORS.energy.heatingCoolingKw * electricityFactor);
    if (savings > 1) {
      suggestions.push({
        id: "energy_ac_thermostat",
        category: "energy",
        title: "Optimize AC & Heating runtime",
        description: "Reduce heating/cooling by just 1 hour per day, or adjust the thermostat by 1-2°C to ease the burden on your HVAC system.",
        savings,
        actionLabel: "Reduce HVAC usage by 1 hr/day",
      });
    }
  }

  // 3. DIET SUGGESTIONS
  const beefMealCO2 = EMISSION_FACTORS.food.beef * 0.15;
  const vegMealCO2 = (EMISSION_FACTORS.food.vegetables * 0.20) + (EMISSION_FACTORS.food.rice * 0.10);
  
  if (inputs.beefMeals > 0) {
    const reducedBeef = Math.ceil(inputs.beefMeals / 2);
    const savings = Math.round(reducedBeef * (beefMealCO2 - vegMealCO2) * weeksPerMonth);
    if (savings > 2) {
      suggestions.push({
        id: "diet_cut_beef",
        category: "food",
        title: `Swap ${reducedBeef} beef meals/week for vegetarian meals`,
        description: "Beef has a massive carbon footprint. Swapping beef for plant-based alternatives is the single most impactful diet change you can make.",
        savings,
        actionLabel: `Cut ${reducedBeef} beef meals/week`,
      });
    }
  }

  if (inputs.chickenMeals > 2) {
    const reducedChicken = 2;
    const savings = Math.round(reducedChicken * (EMISSION_FACTORS.food.chicken * 0.15 - vegMealCO2) * weeksPerMonth);
    if (savings > 1) {
      suggestions.push({
        id: "diet_cut_chicken",
        category: "food",
        title: "Replace 2 meat meals with plant-based options",
        description: "Reduce poultry intake and incorporate more lentils, tofu, and legumes. Plant protein generates a fraction of poultry emissions.",
        savings,
        actionLabel: "2 vegetarian days / week",
      });
    }
  }

  if (inputs.foodWaste > 1) {
    const savings = Math.round((inputs.foodWaste * 0.5) * (EMISSION_FACTORS.waste.landfillPerKg + 2.0) * weeksPerMonth);
    if (savings > 1) {
      suggestions.push({
        id: "diet_food_waste",
        category: "food",
        title: "Reduce food waste by 50%",
        description: "Plan meals before shopping, store ingredients properly, and utilize leftovers. Wasted food represents lost land, water, and transport carbon.",
        savings,
        actionLabel: "Reduce waste by 50%",
      });
    }
  }

  // 4. CONSUMPTION SUGGESTIONS
  if (inputs.clothingItems > 1) {
    const savings = Math.round(1 * EMISSION_FACTORS.consumption.clothingPerItem);
    suggestions.push({
      id: "consumption_thrift_clothing",
      category: "consumption",
      title: "Buy 1 less new clothing item per month",
      description: "Opt for secondhand/vintage thrift stores, or focus on higher-quality garments that last longer. Fast fashion creates high manufacturing emissions.",
      savings,
      actionLabel: "Buy 1 less clothing item/month",
    });
  }

  if (inputs.shoppingLevel === "high" || inputs.shoppingLevel === "medium") {
    const nextLevelMap = { high: "medium", medium: "low", low: "low" };
    const oldSavings = EMISSION_FACTORS.consumption.shoppingFrequency[inputs.shoppingLevel];
    const newSavings = EMISSION_FACTORS.consumption.shoppingFrequency[nextLevelMap[inputs.shoppingLevel] as "low" | "medium"];
    const savings = Math.round(oldSavings - newSavings);
    
    if (savings > 0) {
      suggestions.push({
        id: "consumption_conscious_shopping",
        category: "consumption",
        title: "Mindful purchasing (Reduce miscellaneous shopping)",
        description: "Adopt the '30-day wait' rule for non-essential goods. Reducing minor, frequent online shopping orders cuts down on packaging and express shipping emissions.",
        savings,
        actionLabel: "Adopt mindful shopping habits",
      });
    }
  }

  // 5. WASTE SUGGESTIONS
  if (inputs.recyclePercent < 80 && inputs.wasteAmount > 2) {
    const currentRecycle = inputs.recyclePercent;
    const targetRecycle = Math.min(90, currentRecycle + 30);
    const recycleShiftKg = inputs.wasteAmount * ((targetRecycle - currentRecycle) / 100);
    // Landfill is 1.9, Recycle savings is -0.6.
    // Moving 1kg from Landfill to Recycling saves: 1.9 - (-0.6) = 2.5 kg CO2e
    const savings = Math.round(recycleShiftKg * (EMISSION_FACTORS.waste.landfillPerKg - EMISSION_FACTORS.waste.recycleSavingsPerKg) * weeksPerMonth);
    
    if (savings > 1) {
      suggestions.push({
        id: "waste_boost_recycling",
        category: "waste",
        title: `Increase recycling rate to ${targetRecycle}%`,
        description: `Sort plastics, metal, paper, and glass diligently. Increasing recycling from ${currentRecycle}% to ${targetRecycle}% prevents landfill methane emissions.`,
        savings,
        actionLabel: `Recycle ${targetRecycle}% of waste`,
      });
    }
  }

  if (!inputs.compost && inputs.wasteAmount > 2) {
    // Compost 30% of waste (organic portion)
    const compostKg = inputs.wasteAmount * 0.3;
    // Moving 1kg from Landfill to Composting saves: 1.9 - (-0.2) = 2.1 kg CO2e
    const savings = Math.round(compostKg * (EMISSION_FACTORS.waste.landfillPerKg - EMISSION_FACTORS.waste.compostSavingsPerKg) * weeksPerMonth);
    
    if (savings > 1) {
      suggestions.push({
        id: "waste_composting",
        category: "waste",
        title: "Start composting kitchen scraps",
        description: "Composting organic matter (fruit peels, coffee grounds, veggies) anaerobically keeps it out of landfills where it decays into potent methane gas.",
        savings,
        actionLabel: "Begin Composting",
      });
    }
  }

  // Sort by highest carbon savings
  return suggestions.sort((a, b) => b.savings - a.savings);
}
