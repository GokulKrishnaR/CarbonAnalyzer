export interface RegionalElectricityFactor {
  code: string;
  name: string;
  factor: number; // kg CO2e per kWh
}

export const REGIONAL_ELECTRICITY_FACTORS: RegionalElectricityFactor[] = [
  { code: "GLOBAL", name: "Global Average (0.475 kg CO2e/kWh)", factor: 0.475 },
  { code: "IN_CN", name: "India / China (0.750 kg CO2e/kWh)", factor: 0.750 },
  { code: "US", name: "United States (0.370 kg CO2e/kWh)", factor: 0.370 },
  { code: "EU", name: "European Union (0.250 kg CO2e/kWh)", factor: 0.250 },
  { code: "CA", name: "Canada (0.120 kg CO2e/kWh)", factor: 0.120 },
  { code: "FR", name: "France (0.050 kg CO2e/kWh)", factor: 0.050 }, // High nuclear
];

export const EMISSION_FACTORS = {
  // Transport factors (kg CO2e per km)
  transport: {
    carPetrol: 0.192,
    carDiesel: 0.171,
    carElectric: 0.053,
    bus: 0.105,
    train: 0.041,
    flightPerHour: 150.0, // kg CO2e per hour of flight
    rideSharePerKm: 0.120, // Shared ride
  },

  // Home energy factors
  energy: {
    lpgPerKg: 2.98, // kg CO2e per kg of LPG
    heatingCoolingKw: 1.5, // average power consumption in kW
  },

  // Food factors (kg CO2e per kg of food)
  food: {
    beef: 27.0,
    chicken: 6.9,
    vegetables: 2.0,
    rice: 4.0,
    averageMealWeightKg: 0.25, // average weight of food in a meal
  },

  // Consumption factors (kg CO2e per purchase/level)
  consumption: {
    clothingPerItem: 12.5,
    electronicsPerItem: 150.0,
    shoppingFrequency: {
      low: 15.0,     // kg CO2e per month
      medium: 50.0,
      high: 120.0,
    }
  },

  // Waste factors
  waste: {
    landfillPerKg: 1.9, // kg CO2e per kg waste
    recycleSavingsPerKg: -0.6, // offset credit if recycled (approximate)
    compostSavingsPerKg: -0.2, // offset credit if composted
  },

  // Lifestyle indicators (kg CO2e per hour/level)
  lifestyle: {
    deviceHour: 0.007, // kg CO2e per hour of active device/network use (servers + device)
    travelFreqMultiplier: {
      low: 0.8,
      medium: 1.0,
      high: 1.3,
    }
  }
};

export const GLOBAL_AVERAGE_YEARLY_TONS = 4.5; // tons of CO2e per person per year
