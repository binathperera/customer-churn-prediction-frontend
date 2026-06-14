const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export interface Customer {
  CustomerId: string;
  CreditScore: number;
  Age: number;
  Tenure: number;
  Balance: number;
  NumOfProducts: number;
  HasCrCard: number;
  IsActiveMember: number;
  EstimatedSalary: number;
  Geography: string;
  Gender: string;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  churn: number;
  churn_probability: number;
  status: string;
  confidence: number;
}

export interface CustomerWithPrediction extends Customer {
  prediction?: Prediction;
}

// Fetch all customers
export async function fetchAllCustomers(): Promise<Customer[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/data`);
    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }
    const data = await response.json();
    return data.customers || [];
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
}

// Make prediction for a customer
export async function predictCustomer(
  customerData: Customer,
): Promise<Prediction> {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      throw new Error(`Failed to predict: ${response.status}`);
    }

    const data = await response.json();
    return data.prediction;
  } catch (error) {
    console.error("Error making prediction:", error);
    throw error;
  }
}

// Get statistics
export async function fetchStatistics() {
  try {
    const response = await fetch(`${API_BASE_URL}/data/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching statistics:", error);
    throw error;
  }
}

// Health check
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch {
    return false;
  }
}
