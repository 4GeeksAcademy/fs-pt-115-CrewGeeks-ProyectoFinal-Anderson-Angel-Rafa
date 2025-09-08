import React, { useState } from "react";
import { DateRange } from "react-date-range";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";

// Estilos necesarios del calendario:
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const HolidayCalendar = () => {
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: "selection",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSave = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // ajusta a tu auth real
      const body = {
        company_id: 1, // TODO: pon el de la empresa activa
        employee_id: 5, // TODO: el empleado logueado
        start_date: format(range[0].startDate, "yyyy-MM-dd"),
        end_date: format(range[0].endDate, "yyyy-MM-dd"),
        status: "pending",
        remaining_days: 12, // TODO: calcula según tu lógica
      };

      const res = await fetch(`${API_URL}/holidays/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al guardar");
      setMsg("Solicitud guardada ✅");
    } catch (err) {
      setMsg(err.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const disabled = !range[0]?.startDate || !range[0]?.endDate || loading;

  return (
    <div className="max-w-4xl mx-auto my-8">
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Selecciona tus vacaciones</h2>

        <div className="overflow-x-auto">
          <DateRange
            locale={es}
            ranges={range}
            onChange={(item) => setRange([item.selection])}
            months={2}
            direction="horizontal"
            moveRangeOnFirstSelection={false}
            showDateDisplay={false}
            showPreview={true}
            editableDateInputs={false}
            minDate={new Date()} // evita pasado (opcional)
            // color de selección:
            rangeColors={["#2563eb"]} // azul tailwind 600
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg text-white shadow
              ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
            `}
          >
            {loading ? "Guardando..." : "Guardar solicitud"}
          </button>

          <span className="text-sm text-gray-600">
            {format(range[0].startDate, "dd/MM/yyyy")} — {format(range[0].endDate, "dd/MM/yyyy")}
          </span>
        </div>

        {msg && (
          <div className="mt-3 text-sm">
            {msg.includes("✅") ? (
              <span className="text-green-600">{msg}</span>
            ) : (
              <span className="text-red-600">{msg}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayCalendar;