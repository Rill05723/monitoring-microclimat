"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [latest, setLatest] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => {
    const dbRef = ref(db, "agro/mega/timeseries");

    onValue(dbRef, snap => {
      const val = snap.val();
      if (!val) return;

      const rows: any[] = [];
      Object.keys(val).forEach(date => {
        Object.keys(val[date]).forEach(time => {
          rows.push({
            time: `${date} ${time}`,
            ...val[date][time]
          });
        });
      });

      rows.sort((a,b)=>new Date(a.time).getTime()-new Date(b.time).getTime());
      setSeries(rows.slice(-30));
      setLatest(rows.at(-1));
    });
  }, []);

  if (!latest) return <div className="p-10">Loading...</div>;

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-8">

      {/* HEADER */}
      <header className="flex justify-between mb-10">
        <h1 className="text-3xl font-bold text-green-400">
          🌱 Monitoring Microclimate
        </h1>
        <span className="text-gray-400">Realtime Environment Data</span>
      </header>

      {/* KPI */}
      <section className="grid md:grid-cols-4 gap-6 mb-12">
        <KPI icon="🌡️" label="Suhu Udara" value={latest.temp_air} unit="°C" max={50} />
        <KPI icon="💧" label="Kelembapan Udara" value={latest.hum_air} unit="%" max={100} />
        <KPI icon="🌍" label="Suhu Tanah" value={latest.temp_soil} unit="°C" max={50} />
        <KPI icon="🪴" label="Kelembapan Tanah" value={latest.soil_pct} unit="%" max={100} />
        <KPI icon="☀️" label="Cahaya" value={latest.lux} unit="lux" max={100} />
      </section>

      {/* CHART */}
      <section className="grid md:grid-cols-2 gap-6 mb-10">
        <Chart data={series} keyName="temp_air" title="Suhu Udara (°C)" />
        <Chart data={series} keyName="hum_air" title="Kelembapan Udara (%)" />
        <Chart data={series} keyName="temp_soil" title="Suhu Tanah (°C)" />
        <Chart data={series} keyName="soil_pct" title="Kelembapan Tanah (%)" />
        <Chart data={series} keyName="lux" title="Cahaya (lux)" />
      </section>

      {/* SUMMARY */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-green-400 mb-2">📈 Ringkasan Kondisi</h3>
          <p>
            Kondisi microclimate saat ini berada pada status
            <b className="text-green-400"> NORMAL</b>.
          </p>
        </Card>

        <Card>
          <h3 className="text-green-400 mb-2">🕒 Update Terakhir</h3>
          <p>{latest.time}</p>
          <p className="text-green-400 mt-2">Sensor Online</p>
        </Card>
      </section>

      <footer className="text-center text-gray-500 text-sm mt-12">
        © 2026 Microclimate Dashboard • IoT Monitoring System
      </footer>
    </main>
  );
}

/* ==== COMPONENT ==== */

function KPI({ icon, label, value, unit, max }: any) {
  return (
    <Card>
      <div className="text-3xl">{icon}</div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl text-green-400 font-bold">
        {value} {unit}
      </p>
      <progress value={value} max={max} className="w-full mt-2" />
    </Card>
  );
}

function Chart({ data, keyName, title }: any) {
  return (
    <Card>
      <h3 className="text-green-400 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={keyName}
            stroke="#22c55e"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function Card({ children }: any) {
  return (
    <div className="
      bg-white/5 backdrop-blur-lg
      rounded-2xl p-5
      shadow-xl hover:shadow-green-500/20
      transition
    ">
      {children}
    </div>
  );
}
