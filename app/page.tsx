"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* =========================================
   KNOWLEDGE BASE
========================================= */

const rules = {
  temp_air: {
    getStatus: (v: number) => {
      if (v < 18)
        return {
          status: "Dingin",
          info: "Suhu udara berada di bawah rentang ideal.",
          action:
            "Kurangi ventilasi untuk menjaga suhu greenhouse.",
        };

      if (v <= 30)
        return {
          status: "Optimal",
          info: "Suhu udara berada pada rentang ideal.",
          action: "Tidak diperlukan tindakan.",
        };

      if (v <= 35)
        return {
          status: "Panas",
          info: "Suhu udara berada di atas rentang ideal.",
          action: "Aktifkan kipas ventilasi.",
        };

      return {
        status: "Sangat Panas",
        info: "Suhu udara terlalu tinggi.",
        action:
          "Aktifkan kipas ventilasi dan lakukan pendinginan tambahan.",
      };
    },
  },

  hum_air: {
    getStatus: (v: number) => {
      if (v < 50)
        return {
          status: "Kering",
          info:
            "Kelembapan udara berada di bawah rentang ideal.",
          action:
            "Tingkatkan kelembapan lingkungan.",
        };

      if (v <= 80)
        return {
          status: "Optimal",
          info:
            "Kelembapan udara sesuai kebutuhan tanaman.",
          action:
            "Tidak diperlukan tindakan.",
        };

      return {
        status: "Lembap",
        info:
          "Kelembapan udara terlalu tinggi.",
        action:
          "Tingkatkan ventilasi greenhouse.",
      };
    },
  },

  temp_soil: {
    getStatus: (v: number) => {
      if (v < 18)
        return {
          status: "Dingin",
          info:
            "Suhu tanah berada di bawah rentang ideal.",
          action:
            "Suhu tanah yang rendah berpotensi menghambat pertumbuhan tanaman. Pertahankan kondisi greenhouse agar suhu tanah kembali ke rentang ideal.",
        };

      if (v <= 27)
        return {
          status: "Optimal",
          info:
            "Suhu tanah mendukung pertumbuhan tanaman.",
          action:
            "Tidak diperlukan tindakan.",
        };

      return {
        status: "Panas",
        info:
          "Suhu tanah berada di atas rentang ideal.",
        action:
          "Lakukan penyiraman untuk membantu menurunkan suhu tanah.",
      };
    },
  },

  soil_pct: {
    getStatus: (v: number) => {
      if (v < 60)
        return {
          status: "Kering",
          info:
            "Kelembapan tanah berada di bawah rentang ideal.",
          action:
            "Segera lakukan penyiraman.",
        };

      if (v <= 80)
        return {
          status: "Optimal",
          info:
            "Kelembapan tanah berada pada kondisi ideal.",
          action:
            "Tidak diperlukan tindakan.",
        };

      return {
        status: "Basah",
        info:
          "Kelembapan tanah terlalu tinggi.",
          action:
          "Kurangi penyiraman dan periksa sistem drainase.",
        };
    },
  },
};

export default function Dashboard() {
  const [latest, setLatest] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);

  /* =========================================
     INFORMASI TANAMAN
  ========================================= */

  const [selectedPlant, setSelectedPlant] =
    useState<string | null>(null);

  const plants = [
    {
      id: "cabai",
      icon: "🌶️",
      title: "Cabai",
      description:
        "Cabai (Capsicum annuum L.) merupakan salah satu komoditas hortikultura yang memiliki nilai ekonomi tinggi dan banyak dibudidayakan di Indonesia. Monitoring mikroklimat dapat membantu menjaga kondisi lingkungan yang mendukung pertumbuhan tanaman cabai.",
    },

    {
      id: "tomat",
      icon: "🍅",
      title: "Tomat",
      description:
        "Tomat (Solanum lycopersicum L.) merupakan tanaman buah yang banyak dimanfaatkan sebagai bahan pangan. Pengelolaan kondisi lingkungan greenhouse membantu meningkatkan kualitas hasil panen dan mengurangi pengaruh cuaca ekstrem.",
    },

    {
      id: "mentimun",
      icon: "🥒",
      title: "Mentimun",
      description:
        "Mentimun (Cucumis sativus L.) merupakan tanaman sayuran yang memiliki pertumbuhan relatif cepat. Monitoring lingkungan membantu menjaga kondisi budidaya yang lebih stabil selama masa pertumbuhan.",
    },

    {
      id: "selada",
      icon: "🥬",
      title: "Selada",
      description:
        "Selada (Lactuca sativa L.) merupakan sayuran daun yang populer dalam budidaya greenhouse. Pemantauan kondisi lingkungan dapat membantu menjaga kualitas daun dan mendukung pertumbuhan tanaman.",
    },

    {
      id: "terong",
      icon: "🍆",
      title: "Terong",
      description:
        "Terong (Solanum melongena L.) merupakan tanaman hortikultura yang banyak dibudidayakan di daerah tropis. Monitoring mikroklimat membantu menjaga kestabilan lingkungan yang berpengaruh terhadap pertumbuhan tanaman.",
    },

    {
      id: "pakcoy",
      icon: "🌱",
      title: "Pakcoy",
      description:
        "Pakcoy (Brassica rapa L.) merupakan sayuran daun yang memiliki masa panen relatif singkat. Greenhouse yang dilengkapi sistem monitoring dapat membantu menciptakan lingkungan budidaya yang lebih terkontrol.",
    },
  ];

  useEffect(() => {
    const dbRef = ref(
      db,
      "agro/mega/timeseries"
    );

    onValue(dbRef, (snap) => {
      const val = snap.val();
      if (!val) return;

      const rows: any[] = [];

      const dates = Object.keys(val).sort();
      const lastDate = dates.at(-1);

      if (lastDate && val[lastDate]) {
        Object.keys(val[lastDate]).forEach(
          (time) => {
            const item =
              val[lastDate][time];

            rows.push({
              time: time
                .substring(0, 5)
                .replace("-", ":"),

              rawTime: `${lastDate} ${time}`,

              ...item,
            });
          }
        );
      }

      rows.sort((a, b) =>
        a.time.localeCompare(b.time)
      );

      setSeries(rows);
      setLatest(rows.at(-1));
    });
  }, []);

  if (!latest)
    return (
      <div className="p-10">
        Loading...
      </div>
    );

  const tempAir =
    rules.temp_air.getStatus(
      Number(latest.temp_air)
    );

  const humAir =
    rules.hum_air.getStatus(
      Number(latest.hum_air)
    );

  const tempSoil =
    rules.temp_soil.getStatus(
      Number(latest.temp_soil)
    );

  const soil =
    rules.soil_pct.getStatus(
      Number(latest.soil_pct)
    );

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-8">

      {/* HEADER */}

      <header className="flex justify-between mb-10">
        <h1 className="text-3xl font-bold text-green-400">
          🌱 Monitoring Microclimate
        </h1>

        <span className="text-gray-400">
          Data Harian (Otomatis Hari Terakhir)
        </span>
      </header>

      {/* KPI */}

      <section className="grid md:grid-cols-5 gap-6 mb-12">

        <KPI
          icon="🌡️"
          label="Suhu Udara"
          value={latest.temp_air}
          unit="°C"
          max={50}
        />

        <KPI
          icon="💧"
          label="Kelembapan Udara"
          value={latest.hum_air}
          unit="%"
          max={100}
        />

        <KPI
          icon="🌍"
          label="Suhu Tanah"
          value={latest.temp_soil}
          unit="°C"
          max={50}
        />

        <KPI
          icon="🪴"
          label="Kelembapan Tanah"
          value={latest.soil_pct}
          unit="%"
          max={100}
        />

        <KPI
          icon="☀️"
          label="Cahaya"
          value={latest.lux}
          unit="lux"
          max={100}
        />

      </section>
            {/* CHART */}
      <section className="grid md:grid-cols-2 gap-6 mb-10">

        <Chart
          data={series}
          keyName="temp_air"
          title="Suhu Udara (°C)"
        />

        <Chart
          data={series}
          keyName="hum_air"
          title="Kelembapan Udara (%)"
        />

        <Chart
          data={series}
          keyName="temp_soil"
          title="Suhu Tanah (°C)"
        />

        <Chart
          data={series}
          keyName="soil_pct"
          title="Kelembapan Tanah (%)"
        />

        <Chart
          data={series}
          keyName="lux"
          title="Cahaya (lux)"
        />

      </section>

      {/* ANALISIS SISTEM */}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

        <AnalysisCard
          icon="🌡️"
          title="Suhu Udara"
          data={tempAir}
        />

        <AnalysisCard
          icon="💧"
          title="Kelembapan Udara"
          data={humAir}
        />

        <AnalysisCard
          icon="🌱"
          title="Suhu Tanah"
          data={tempSoil}
        />

        <AnalysisCard
          icon="🪴"
          title="Kelembapan Tanah"
          data={soil}
        />

      </section>

      {/* INFORMASI TANAMAN */}

      <section className="mb-10">

        <h2 className="text-2xl font-bold text-green-400 mb-6">
          🌱 Informasi Tanaman Greenhouse
        </h2>

        <div className="space-y-4">

          {plants.map((plant) => (

            <Card key={plant.id}>

              <button
                className="w-full flex justify-between items-center"
                onClick={() =>
                  setSelectedPlant(
                    selectedPlant === plant.id
                      ? null
                      : plant.id
                  )
                }
              >

                <div className="flex items-center gap-3">

                  <span className="text-3xl">
                    {plant.icon}
                  </span>

                  <span className="font-bold text-lg">
                    {plant.title}
                  </span>

                </div>

                <span className="text-green-400 text-xl">
                  {selectedPlant === plant.id
                    ? "▲"
                    : "▼"}
                </span>

              </button>

              {selectedPlant === plant.id && (

                <div className="mt-4 text-gray-300 leading-relaxed">

                  {plant.description}

                </div>

              )}

            </Card>

          ))}

        </div>

      </section>

      {/* UPDATE TERAKHIR */}

      <section className="grid md:grid-cols-3 gap-6">

        <Card>

          <h3 className="text-green-400 mb-2">
            🕒 Update Terakhir
          </h3>

          <p>
            {latest.rawTime}
          </p>

          <p className="text-green-400 mt-2">
            Sensor Online
          </p>

        </Card>

      </section>

      <footer className="text-center text-gray-500 text-sm mt-12">

        © 2026 Microclimate Dashboard • IoT Monitoring System

      </footer>

    </main>
  );
}
/* =========================================
   COMPONENT KPI
========================================= */

function KPI({
  icon,
  label,
  value,
  unit,
  max,
}: any) {
  return (
    <Card>
      <div className="text-3xl mb-2">
        {icon}
      </div>

      <p className="text-gray-400 text-sm">
        {label}
      </p>

      <p className="text-2xl text-green-400 font-bold">
        {value} {unit}
      </p>

      <progress
        value={value}
        max={max}
        className="w-full mt-2"
      />
    </Card>
  );
}

/* =========================================
   COMPONENT CHART
========================================= */

function Chart({
  data,
  keyName,
  title,
}: any) {
  return (
    <Card>
      <h3 className="text-green-400 mb-2">
        {title}
      </h3>

      <ResponsiveContainer
        width="100%"
        height={220}
      >
        <LineChart data={data}>

          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />

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
/* =========================================
   COMPONENT ANALYSIS CARD
========================================= */

function AnalysisCard({
  icon,
  title,
  data,
}: any) {

  const statusColor = {
    Optimal: "text-green-400",
    Panas: "text-yellow-400",
    Lembap: "text-yellow-400",
    Basah: "text-yellow-400",
    Kering: "text-red-400",
    Dingin: "text-blue-400",
    "Sangat Panas": "text-red-500",
  };

  return (
    <Card>

      <div className="flex items-center gap-3 mb-4">

        <div className="text-3xl">
          {icon}
        </div>

        <div>

          <h3 className="text-lg font-bold text-green-400">
            {title}
          </h3>

          <p
            className={`font-semibold ${
              statusColor[
                data.status as keyof typeof statusColor
              ]
            }`}
          >
            {data.status}
          </p>

        </div>

      </div>

      <div className="space-y-4">

        <div>

          <p className="font-semibold text-gray-300 mb-1">
            Informasi
          </p>

          <p className="text-gray-400">
            {data.info}
          </p>

        </div>

        <div>

          <p className="font-semibold text-gray-300 mb-1">
            Rekomendasi
          </p>

          <p className="text-gray-400">
            {data.action}
          </p>

        </div>

      </div>

    </Card>
  );
}

/* =========================================
   COMPONENT CARD
========================================= */

function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        bg-white/5
        backdrop-blur-lg
        rounded-2xl
        p-5
        shadow-xl
        hover:shadow-green-500/20
        transition
      "
    >
      {children}
    </div>
  );
}
