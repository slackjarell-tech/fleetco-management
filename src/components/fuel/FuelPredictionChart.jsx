import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, Flame, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from "lucide-react";
import moment from "moment";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-900 mb-1">{moment(label).format("MMM D, ddd")}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-slate-600">{p.name}</span>
          <span className="font-bold" style={{ color: p.color }}>${p.value.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
};

export default function FuelPredictionChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(14);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    const response = await api.functions.invoke("predictFuelPrices", {});
    if (response.data?.error) {
      setError(response.data.error);
    } else {
      setData(response.data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPredictions(); }, []);

  const chartData = data?.predictions
    ?.slice(0, days)
    .map(p => ({
      date: p.date,
      Diesel: p.diesel_price,
      Gasoline: p.gasoline_price,
      trend: p.trend,
      note: p.note
    })) || [];

  const currentDiesel = data?.current_avg_diesel;
  const currentGas = data?.current_avg_gas;

  const minPrice = chartData.length
    ? Math.min(...chartData.flatMap(d => [d.Diesel, d.Gasoline])) - 0.05
    : 3.00;
  const maxPrice = chartData.length
    ? Math.max(...chartData.flatMap(d => [d.Diesel, d.Gasoline])) + 0.05
    : 5.00;

  const getTrendIcon = (trend) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-red-500" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3 text-green-500" />;
    return <Minus className="w-3 h-3 text-slate-400" />;
  };

  const priceChange = data?.predictions?.length
    ? {
        diesel: (data.predictions[13].diesel_price - currentDiesel).toFixed(3),
        gas: (data.predictions[13].gasoline_price - currentGas).toFixed(3)
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">14-Day Fuel Price Forecast</h3>
          <p className="text-xs text-slate-500">
            AI prediction based on current market data, crude oil trends & seasonal patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1 rounded-md text-xs font-medium ${days === 7 ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDays(14)}
              className={`px-3 py-1 rounded-md text-xs font-medium ${days === 14 ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              14 Days
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={fetchPredictions} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Current price cards */}
      {currentDiesel && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Fuel className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Diesel · National Avg</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">${currentDiesel.toFixed(3)}</div>
            {priceChange && (
              <div className={`text-xs mt-1 ${parseFloat(priceChange.diesel) > 0 ? "text-red-600" : parseFloat(priceChange.diesel) < 0 ? "text-green-600" : "text-slate-500"}`}>
                14-day forecast: {parseFloat(priceChange.diesel) > 0 ? "+" : ""}{priceChange.diesel}
              </div>
            )}
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Gasoline · National Avg</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">${currentGas.toFixed(3)}</div>
            {priceChange && (
              <div className={`text-xs mt-1 ${parseFloat(priceChange.gas) > 0 ? "text-red-600" : parseFloat(priceChange.gas) < 0 ? "text-green-600" : "text-slate-500"}`}>
                14-day forecast: {parseFloat(priceChange.gas) > 0 ? "+" : ""}{priceChange.gas}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-72">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Analyzing market data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-slate-400">
          <p>Unable to load predictions. Try again.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(d) => moment(d).format("M/D")}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => `$${v.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {currentDiesel && (
                <ReferenceLine
                  y={currentDiesel}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ value: `$${currentDiesel.toFixed(2)}`, position: "right", fontSize: 10, fill: "#d97706" }}
                />
              )}
              {currentGas && (
                <ReferenceLine
                  y={currentGas}
                  stroke="#ea580c"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ value: `$${currentGas.toFixed(2)}`, position: "right", fontSize: 10, fill: "#ea580c" }}
                />
              )}
              <Line
                type="monotone"
                dataKey="Diesel"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#d97706" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Gasoline"
                stroke="#ea580c"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#ea580c" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily breakdown table */}
      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Diesel</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Gasoline</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Trend</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Driver</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {moment(d.date).format("ddd, MMM D")}
                      {i === 0 && <Badge className="ml-2 bg-green-100 text-green-700 text-[10px]">Today</Badge>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">${d.Diesel.toFixed(3)}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">${d.Gasoline.toFixed(3)}</td>
                    <td className="px-4 py-2.5">{getTrendIcon(d.trend)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">{d.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center">
        Predictions are AI-generated estimates based on current market conditions. Actual prices may vary.
      </p>
    </div>
  );
}