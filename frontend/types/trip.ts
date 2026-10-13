export type Activity = {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  start_time: string | null;
  end_time: string | null;
  estimated_cost: number | null;
  type: string | null;
};

export type ItineraryDay = {
  id: number;
  day_number: number;
  date: string;
  activities: Activity[];
};

export type TripInterest = {
  id: number;
  interest: string;
};

export type Trip = {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | null;
  travelers: number;
  travel_style: string | null;
  interests: TripInterest[];
  days: ItineraryDay[];
  total_estimated_cost: number;
};

export type DailyWeather = {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_probability: number | null;
  description: string;
};

export type WeatherResponse = {
  destination: string;
  forecast_available: boolean;
  days: DailyWeather[];
};