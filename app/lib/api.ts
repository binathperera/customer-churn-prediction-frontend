const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export interface Customer {
  id?: string;
  CustomerId?: string;
  Surname?: string;
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
  Exited?: number;
  created_at?: string;
  updated_at?: string;
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

export interface FetchCustomersParams {
  limit?: number;
  offset?: number;
  CustomerId?: string;
  id?: string;
  Surname?: string;
  Age?: string;
  Tenure?: string;
  Gender?: string;
  Exited?: number;
}

export interface FetchCustomersResponse {
  total_filtered_records: number;
  returned_records: number;
  limit: number;
  offset: number;
  customers: Customer[];
}

// Fetch customers with filtering and pagination
export async function fetchAllCustomers(
  params: FetchCustomersParams = {},
): Promise<FetchCustomersResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/data`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
}

// Make prediction for a customer
export async function predictCustomer(
  customerData: Customer | Partial<Customer>,
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
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to predict: ${response.status}`);
    }

    const data = await response.json();
    return data.prediction;
  } catch (error) {
    console.error("Error making prediction:", error);
    throw error;
  }
}

// Create a new customer
export async function createCustomer(
  customerData: Partial<Customer>,
): Promise<Customer> {
  try {
    const response = await fetch(`${API_BASE_URL}/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.error || `Failed to create customer: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.customer;
  } catch (error) {
    console.error("Error creating customer:", error);
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
