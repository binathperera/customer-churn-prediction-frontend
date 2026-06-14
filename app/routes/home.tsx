import type { Route } from "./+types/home";
import { CustomersList } from "../components/CustomersList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Customer Churn Prediction Dashboard" },
    {
      name: "description",
      content: "Analyze customer churn predictions with real-time data",
    },
  ];
}

export default function Home() {
  return <CustomersList />;
}
