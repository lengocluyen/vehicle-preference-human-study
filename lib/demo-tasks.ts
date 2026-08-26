import type { EvaluationTask, PairwiseTask, VehicleListing } from "./study-types";

const listing = (
  id: string,
  label: string,
  values: Record<string, string | number | null>,
): VehicleListing => ({ id, label, values });

const referenceFamily = listing("syn_ref_family", "Synthetic reference F-01", {
  "Listed price": "EUR 22,500",
  "First registration": 2021,
  Mileage: "48,000 km",
  Energy: "Petrol",
  "Vehicle type": "Compact family car",
  Consumption: "5.7 L/100 km",
  "Seller distance": "35 km",
  Capacity: "5 seats / 5 doors",
  Equipment: "Navigation; parking sensors; cruise control",
});

const referenceUrban = listing("syn_ref_urban", "Synthetic reference U-01", {
  "Listed price": "EUR 18,900",
  "First registration": 2020,
  Mileage: "36,000 km",
  Energy: "Hybrid petrol-electric",
  "Vehicle type": "Small hatchback",
  Consumption: "4.3 L/100 km",
  "Seller distance": "18 km",
  Capacity: "5 seats / 5 doors",
  Equipment: "Rear camera; climate control",
});

const referenceElectric = listing("syn_ref_electric", "Synthetic reference E-01", {
  "Listed price": "EUR 27,800",
  "First registration": 2022,
  Mileage: "29,000 km",
  Energy: "Electric",
  "Vehicle type": "Compact crossover",
  Consumption: "16.8 kWh/100 km",
  "Seller distance": "72 km",
  Capacity: "5 seats / 5 doors",
  Equipment: "Heat pump; navigation; adaptive cruise control",
});

export const practiceTopics = [
  {
    title: "Very similar descriptions",
    text: "Two alternatives may be close on most properties. Choose according to what matters to you; there is no research-defined best answer.",
  },
  {
    title: "Price versus vehicle category",
    text: "A cheaper alternative may differ in body type. The interface does not tell you which difference should dominate.",
  },
  {
    title: "Same manufacturer, different use",
    text: "A shared manufacturer name does not make an alternative suitable if its practical characteristics do not fit your needs.",
  },
  {
    title: "Information not provided",
    text: "“Not provided” means the synthetic listing does not state that value. It never means zero or none.",
  },
  {
    title: "Different energy sources",
    text: "Treat electric, hybrid, petrol, and diesel options according to your own constraints and preferences.",
  },
  {
    title: "Equipment versus numeric differences",
    text: "Feature overlap and differences in price, age, mileage, or consumption can all matter. No property is preselected as decisive.",
  },
  {
    title: "Two acceptable alternatives",
    text: "In a choice task, select the option you would be more willing to consider. Use “Cannot judge” instead of inventing a preference.",
  },
  {
    title: "Insufficient evidence",
    text: "When the displayed information does not support a judgment, “Cannot judge” is a valid response and is not treated as a low grade.",
  },
] as const;

export const demoSupportTasks: PairwiseTask[] = [
  {
    taskId: "demo_support_001",
    queryId: "demo_s_001",
    reference: referenceFamily,
    candidateA: listing("syn_s001_a", "Synthetic vehicle A", {
      "Listed price": "EUR 21,700",
      "First registration": 2020,
      Mileage: "53,000 km",
      Energy: "Petrol",
      "Vehicle type": "Compact family car",
      Consumption: "5.9 L/100 km",
      "Seller distance": "22 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Navigation; parking sensors",
    }),
    candidateB: listing("syn_s001_b", "Synthetic vehicle B", {
      "Listed price": "EUR 24,100",
      "First registration": 2022,
      Mileage: "31,000 km",
      Energy: "Petrol",
      "Vehicle type": "Compact family car",
      Consumption: "5.5 L/100 km",
      "Seller distance": "96 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Navigation; rear camera; adaptive cruise control",
    }),
  },
  {
    taskId: "demo_support_002",
    queryId: "demo_s_002",
    reference: referenceUrban,
    candidateA: listing("syn_s002_a", "Synthetic vehicle A", {
      "Listed price": "EUR 17,600",
      "First registration": 2019,
      Mileage: "42,000 km",
      Energy: "Petrol",
      "Vehicle type": "Small hatchback",
      Consumption: "5.1 L/100 km",
      "Seller distance": "11 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Climate control; parking sensors",
    }),
    candidateB: listing("syn_s002_b", "Synthetic vehicle B", {
      "Listed price": "EUR 20,300",
      "First registration": 2021,
      Mileage: "39,000 km",
      Energy: "Hybrid petrol-electric",
      "Vehicle type": "Small crossover",
      Consumption: "4.6 L/100 km",
      "Seller distance": "47 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Rear camera; climate control",
    }),
  },
  {
    taskId: "demo_support_003",
    queryId: "demo_s_003",
    reference: referenceElectric,
    candidateA: listing("syn_s003_a", "Synthetic vehicle A", {
      "Listed price": "EUR 26,900",
      "First registration": 2021,
      Mileage: "34,000 km",
      Energy: "Electric",
      "Vehicle type": "Compact hatchback",
      Consumption: "15.9 kWh/100 km",
      "Seller distance": "54 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Navigation; adaptive cruise control",
    }),
    candidateB: listing("syn_s003_b", "Synthetic vehicle B", {
      "Listed price": "EUR 29,200",
      "First registration": 2023,
      Mileage: "18,000 km",
      Energy: "Electric",
      "Vehicle type": "Compact crossover",
      Consumption: null,
      "Seller distance": "105 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Heat pump; navigation; rear camera",
    }),
  },
];

export const demoEvaluationTasks: EvaluationTask[] = [
  {
    taskId: "demo_evaluation_001",
    queryId: "demo_e_001",
    reference: referenceFamily,
    candidate: listing("syn_e001", "Synthetic candidate C-01", {
      "Listed price": "EUR 20,900",
      "First registration": 2020,
      Mileage: "61,000 km",
      Energy: "Diesel",
      "Vehicle type": "Estate family car",
      Consumption: "4.9 L/100 km",
      "Seller distance": "64 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Navigation; cruise control; large luggage space",
    }),
  },
  {
    taskId: "demo_evaluation_002",
    queryId: "demo_e_002",
    reference: referenceFamily,
    candidate: listing("syn_e002", "Synthetic candidate C-02", {
      "Listed price": "EUR 23,300",
      "First registration": 2021,
      Mileage: "44,000 km",
      Energy: "Petrol",
      "Vehicle type": "Compact family car",
      Consumption: "5.8 L/100 km",
      "Seller distance": "28 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Navigation; parking sensors; cruise control",
    }),
  },
  {
    taskId: "demo_evaluation_003",
    queryId: "demo_e_003",
    reference: referenceUrban,
    candidate: listing("syn_e003", "Synthetic candidate C-03", {
      "Listed price": "EUR 16,800",
      "First registration": 2018,
      Mileage: "74,000 km",
      Energy: "Petrol",
      "Vehicle type": "Small hatchback",
      Consumption: null,
      "Seller distance": "9 km",
      Capacity: "4 seats / 3 doors",
      Equipment: "Climate control",
    }),
  },
  {
    taskId: "demo_evaluation_004",
    queryId: "demo_e_004",
    reference: referenceElectric,
    candidate: listing("syn_e004", "Synthetic candidate C-04", {
      "Listed price": "EUR 28,100",
      "First registration": 2022,
      Mileage: "27,000 km",
      Energy: "Electric",
      "Vehicle type": "Compact crossover",
      Consumption: "17.2 kWh/100 km",
      "Seller distance": "81 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Heat pump; navigation; adaptive cruise control",
    }),
  },
  {
    taskId: "demo_evaluation_005",
    queryId: "demo_e_005",
    reference: referenceUrban,
    candidate: listing("syn_e005", "Synthetic candidate C-05", {
      "Listed price": "EUR 21,400",
      "First registration": 2022,
      Mileage: "25,000 km",
      Energy: "Electric",
      "Vehicle type": "Small hatchback",
      Consumption: "14.8 kWh/100 km",
      "Seller distance": "39 km",
      Capacity: "5 seats / 5 doors",
      Equipment: "Rear camera; climate control; navigation",
    }),
  },
];

export const controlledReasons = [
  ["price_budget", "Price or budget"],
  ["location_travel", "Location or travel"],
  ["energy_source", "Energy source"],
  ["vehicle_type", "Vehicle type"],
  ["year_age", "Year or age"],
  ["mileage", "Mileage"],
  ["consumption", "Consumption or emissions"],
  ["capacity", "Capacity or doors"],
  ["equipment", "Equipment"],
  ["missing_information", "Missing or unclear information"],
] as const;
