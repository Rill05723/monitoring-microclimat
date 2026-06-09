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
            "Pertahankan kondisi greenhouse agar suhu tanah kembali ke rentang ideal.",
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
/* =========================================
   AI RECOMMENDATION
========================================= */

function getPredictionRecommendation(
  temp: number,
  hum: number
) {

  if (
    temp >= 24 &&
    temp <= 30 &&
    hum >= 60 &&
    hum <= 80
  ) {

    return {
      status: "Optimal",
      icon: "✅",
      color: "text-green-400",
      info:
        "Kondisi lingkungan diperkirakan tetap stabil dalam 1 jam ke depan.",
      action:
        "Tidak diperlukan tindakan khusus selain pemantauan rutin."
    };
  }

  if (
    temp > 30 &&
    hum < 60
  ) {

    return {
      status: "Panas dan Kering",
      icon: "🔥",
      color: "text-orange-400",
      info:
        "Suhu diperkirakan meningkat sementara kelembapan udara menurun.",
      action:
        "Aktifkan kipas ventilasi dan lakukan penyiraman ringan untuk membantu menjaga kelembapan lingkungan greenhouse."
    };
  }

  if (
    temp > 30 &&
    hum > 80
  ) {

    return {
      status: "Panas dan Lembap",
      icon: "🌡️",
      color: "text-yellow-400",
      info:
        "Suhu dan kelembapan udara diperkirakan berada pada tingkat tinggi.",
      action:
        "Aktifkan kipas ventilasi untuk meningkatkan sirkulasi udara dan membantu mengurangi kelembapan berlebih."
    };
  }

  if (
    temp < 24 &&
    hum > 80
  ) {

    return {
      status: "Dingin dan Lembap",
      icon: "🌫️",
      color: "text-cyan-400",
      info:
        "Suhu diperkirakan rendah dengan kelembapan udara tinggi.",
      action:
        "Kurangi ventilasi sementara dan lakukan pemantauan kondisi greenhouse secara berkala."
    };
  }

  if (
    temp < 24 &&
    hum < 60
  ) {

    return {
      status: "Dingin dan Kering",
      icon: "❄️",
      color: "text-blue-400",
      info:
        "Suhu dan kelembapan udara berada di bawah rentang ideal.",
      action:
        "Kurangi ventilasi dan lakukan pemantauan kondisi lingkungan greenhouse."
    };
  }

  if (hum > 80) {

    return {
      status: "Kelembapan Tinggi",
      icon: "💧",
      color: "text-sky-400",
      info:
        "Kelembapan udara diperkirakan meningkat.",
      action:
        "Pastikan sirkulasi udara greenhouse tetap baik."
    };
  }

  if (temp > 30) {

    return {
      status: "Suhu Tinggi",
      icon: "☀️",
      color: "text-red-400",
      info:
        "Suhu udara diperkirakan berada di atas rentang ideal.",
      action:
        "Aktifkan kipas ventilasi untuk membantu menjaga kestabilan suhu."
    };
  }

  return {
    status: "Monitoring",
    icon: "📊",
    color: "text-gray-400",
    info:
      "Kondisi lingkungan diperkirakan masih aman.",
    action:
      "Lanjutkan pemantauan berkala terhadap kondisi greenhouse."
  };
}
export default function Dashboard() {

  /* =========================================
     DATA SENSOR
  ========================================= */

  const [latest, setLatest] =
    useState<any>(null);

  const [series, setSeries] =
    useState<any[]>([]);

  /* =========================================
     DATA PREDIKSI AI
  ========================================= */

  const [prediction, setPrediction] =
    useState<any>(null);
  const latestTempPrediction =
  prediction?.temp_air
    ? Object.entries(prediction.temp_air)
        .sort(([a], [b]) =>
          a.localeCompare(b)
        )
        .at(-1)?.[1]
    : null;

const latestHumPrediction =
  prediction?.hum_air
    ? Object.entries(prediction.hum_air)
        .sort(([a], [b]) =>
          a.localeCompare(b)
        )
        .at(-1)?.[1]
    : null;

  /* =========================================
     DATA TANAMAN
  ========================================= */

  const [selectedPlant, setSelectedPlant] =
    useState<string | null>(null);
  
  /* =========================================
     DATA TANAMAN
  ========================================= */

  const plants = [
    {
      id: "cabai",
      icon: "🌶️",
      title: "Cabai",

      scientific:
        "Capsicum annuum L.",

      description:
        "Cabai merupakan salah satu komoditas hortikultura yang memiliki nilai ekonomi tinggi dan banyak dibudidayakan di Indonesia.",

      benefit: [
        "Sumber vitamin A dan vitamin C",
        "Memiliki nilai ekonomi tinggi",
        "Banyak digunakan sebagai bahan pangan",
      ],

      characteristic: [
        "Tanaman semusim",
        "Memiliki sistem perakaran serabut",
        "Dapat dibudidayakan di greenhouse",
      ],

      greenhouse:
        "Budidaya cabai di greenhouse membantu menjaga kestabilan kondisi lingkungan sehingga tanaman lebih terlindungi dari perubahan cuaca.",
    },

    {
      id: "tomat",
      icon: "🍅",
      title: "Tomat",

      scientific:
        "Solanum lycopersicum L.",

      description:
        "Tomat merupakan tanaman buah yang banyak dimanfaatkan sebagai bahan pangan dan memiliki nilai ekonomi yang tinggi.",

      benefit: [
        "Mengandung vitamin C",
        "Sumber antioksidan likopen",
        "Banyak digunakan sebagai bahan pangan",
      ],

      characteristic: [
        "Tanaman semusim",
        "Menghasilkan buah selama masa produksi",
        "Memerlukan penyangga saat pertumbuhan",
      ],

      greenhouse:
        "Greenhouse membantu menjaga kestabilan lingkungan sehingga kualitas dan produktivitas tomat dapat meningkat.",
    },

    {
      id: "mentimun",
      icon: "🥒",
      title: "Mentimun",

      scientific:
        "Cucumis sativus L.",

      description:
        "Mentimun merupakan tanaman sayuran yang memiliki pertumbuhan relatif cepat dan banyak dikonsumsi dalam keadaan segar.",

      benefit: [
        "Menyegarkan tubuh",
        "Mengandung banyak air",
        "Banyak digunakan sebagai lalapan",
      ],

      characteristic: [
        "Tanaman merambat",
        "Pertumbuhan relatif cepat",
        "Membutuhkan penyangga",
      ],

      greenhouse:
        "Monitoring lingkungan membantu menjaga kestabilan kondisi budidaya mentimun selama masa pertumbuhan.",
    },

    {
      id: "selada",
      icon: "🥬",
      title: "Selada",

      scientific:
        "Lactuca sativa L.",

      description:
        "Selada merupakan sayuran daun yang populer dan sering dibudidayakan dalam greenhouse.",

      benefit: [
        "Mengandung vitamin A",
        "Mengandung vitamin K",
        "Banyak digunakan dalam salad",
      ],

      characteristic: [
        "Sayuran daun",
        "Masa panen relatif singkat",
        "Mudah dibudidayakan",
      ],

      greenhouse:
        "Pemantauan kondisi lingkungan membantu menjaga kualitas daun dan pertumbuhan tanaman selada.",
    },

    {
      id: "terong",
      icon: "🍆",
      title: "Terong",

      scientific:
        "Solanum melongena L.",

      description:
        "Terong merupakan tanaman hortikultura yang banyak dibudidayakan di daerah tropis.",

      benefit: [
        "Mengandung serat",
        "Sumber antioksidan",
        "Banyak dimanfaatkan sebagai bahan pangan",
      ],

      characteristic: [
        "Tanaman buah",
        "Adaptif terhadap iklim tropis",
        "Memiliki umur panen cukup panjang",
      ],

      greenhouse:
        "Monitoring mikroklimat membantu menjaga kestabilan lingkungan yang berpengaruh terhadap pertumbuhan tanaman terong.",
    },

    {
      id: "pakcoy",
      icon: "🌱",
      title: "Pakcoy",

      scientific:
        "Brassica rapa L.",

      description:
        "Pakcoy merupakan sayuran daun yang memiliki masa panen relatif singkat dan banyak dikonsumsi masyarakat.",

      benefit: [
        "Kaya vitamin A",
        "Kaya vitamin C",
        "Memiliki nilai gizi tinggi",
      ],

      characteristic: [
        "Sayuran daun",
        "Pertumbuhan cepat",
        "Mudah dibudidayakan",
      ],

      greenhouse:
        "Greenhouse yang dilengkapi monitoring membantu menciptakan lingkungan budidaya yang lebih terkontrol.",
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

              rawTime:
                `${lastDate} ${time}`,

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
  /* =========================================
   DATA PREDIKSI AI
========================================= */

useEffect(() => {

  const predRef = ref(
    db,
    "agro/mega/predictions"
  );

  onValue(predRef, (snap) => {

    const val = snap.val();

    if (!val) return;

    setPrediction(val);

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
  /* =========================================
   AI PREDICTION ANALYSIS
========================================= */

const aiAdvice =
  latestTempPrediction &&
  latestHumPrediction
    ? getPredictionRecommendation(
        Number(
          latestTempPrediction.value
        ),
        Number(
          latestHumPrediction.value
        )
      )
    : null;

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-8">

      <header className="flex justify-between mb-10">
        <h1 className="text-3xl font-bold text-green-400">
          Monitoring Microclimate UPT Produksi Benih Tanaman Pangan Hortikutura dan Perkebunan
        </h1>

        <span className="text-gray-400">
          Data Harian (Otomatis Hari Terakhir)
        </span>
      </header>

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

    

{/* =========================================
    AI PREDICTION
========================================= */}

{latestTempPrediction &&
 latestHumPrediction &&
 aiAdvice && (

  <section className="mb-10">

    <Card>

      <h2 className="text-2xl font-bold text-green-400 mb-6">
         Prediksi 1 Jam Kedepan
      </h2>
      <p className="text-sm text-gray-400 mb-6">
  Prediksi pada:
  {latestTempPrediction?.created_at}
</p>
      

      <div className="grid md:grid-cols-2 gap-6 mb-6">

        <div>

          <p className="text-gray-400">
            Prediksi Suhu Udara
          </p>

          <p className="text-4xl font-bold text-orange-400">
            {latestTempPrediction?.value} °C
          </p>

        </div>

        <div>

          <p className="text-gray-400">
            Prediksi Kelembapan Udara
          </p>

          <p className="text-4xl font-bold text-cyan-400">
            {latestHumPrediction?.value} %
          </p>

        </div>

      </div>

      <div className="border-t border-white/10 pt-4">

        <h3 className="font-bold text-lg mb-2">
          {aiAdvice.icon} {aiAdvice.status}
        </h3>

        <div className="mb-4">

          <p className="font-semibold text-gray-300">
            Analisis
          </p>

          <p className="text-gray-400">
            {aiAdvice.info}
          </p>

        </div>

        <div>

          <p className="font-semibold text-gray-300">
            Rekomendasi
          </p>

          <p className="text-gray-400">
            {aiAdvice.action}
          </p>

        </div>

      </div>

    </Card>

  </section>

)}

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
          icon="🌍"
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
           Informasi Tanaman Greenhouse
        </h2>

        <div className="space-y-4">

          {plants.map((plant) => (

            <Card key={plant.id}>

              <button
                className="
                  w-full
                  flex
                  justify-between
                  items-center
                  text-left
                "
                onClick={() =>
                  setSelectedPlant(
                    selectedPlant === plant.id
                      ? null
                      : plant.id
                  )
                }
              >

                <div className="flex items-center gap-3">

                  <span className="text-4xl">
                    {plant.icon}
                  </span>

                  <div>

                    <h3 className="font-bold text-lg text-green-400">
                      {plant.title}
                    </h3>

                    <p className="text-sm text-gray-400">
                      Klik untuk melihat informasi
                    </p>

                  </div>

                </div>

                <span className="text-green-400 text-xl">
                  {selectedPlant === plant.id
                    ? "▲"
                    : "▼"}
                </span>

              </button>

              {selectedPlant === plant.id && (

                <div className="mt-6 space-y-5 border-t border-green-500/20 pt-5">

                  {/* Nama Ilmiah */}

                  <div>

                    <h4 className="font-semibold text-green-400 mb-1">
                      Nama Ilmiah
                    </h4>

                    <p className="text-gray-300 italic">
                      {plant.scientific}
                    </p>

                  </div>

                  {/* Deskripsi */}

                  <div>

                    <h4 className="font-semibold text-green-400 mb-1">
                      Deskripsi
                    </h4>

                    <p className="text-gray-300 leading-relaxed">
                      {plant.description}
                    </p>

                  </div>

                  {/* Manfaat */}

                  <div>

                    <h4 className="font-semibold text-green-400 mb-2">
                      Manfaat
                    </h4>

                    <ul className="list-disc ml-6 text-gray-300 space-y-1">

                      {plant.benefit.map(
                        (
                          item: string,
                          index: number
                        ) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}

                    </ul>

                  </div>

                  {/* Karakteristik */}

                  <div>

                    <h4 className="font-semibold text-green-400 mb-2">
                      Karakteristik
                    </h4>

                    <ul className="list-disc ml-6 text-gray-300 space-y-1">

                      {plant.characteristic.map(
                        (
                          item: string,
                          index: number
                        ) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}

                    </ul>

                  </div>

                  {/* Greenhouse */}

                  <div>

                    <h4 className="font-semibold text-green-400 mb-1">
                      Kaitan dengan Greenhouse
                    </h4>

                    <p className="text-gray-300 leading-relaxed">
                      {plant.greenhouse}
                    </p>

                  </div>

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
