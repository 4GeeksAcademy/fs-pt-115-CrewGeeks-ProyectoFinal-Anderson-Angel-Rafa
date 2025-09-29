import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import "./EmployeePayroll.css";

const urlApi = import.meta.env.VITE_BACKEND_URL + "/api";
const MONTHS = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const periodLabel = (y,m) => `${MONTHS[Number(m)] || m} de ${y}`;

export const EmployeePayroll = () => {
  const { token, user } = useAuth(); // espero user?.id
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const headersAuth = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch(`${urlApi}/payrolls?limit=100&page=1`, {
          headers: { ...headersAuth },
        });
        const data = await response.json().catch(() => ({}));

        // soporta array o {items}
        let list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);

        // normaliza campos mínimos
        list = list.map(r => ({
          id: r.id,
          employee_id: r.employee_id,
          period_year: r.period_year ?? r.year,
          period_month: r.period_month ?? r.month,
          original_filename: r.original_filename || `nomina_${r.id}.pdf`,
          gross: r.gross ?? null,
          deductions: r.deductions ?? null,
          net: r.net ?? null,
          status: r.status || "Pagado",
          uploaded_at: r.uploaded_at || null,
        }));

        // si llega listado company-wide y tenemos user.id, filtramos client-side
        if (user?.id) {
          list = list.filter(r => String(r.employee_id) === String(user.id));
        }

        // orden descendente por año/mes
        list.sort((a,b) => {
          const kb = `${String(b.period_year).padStart(4,"0")}${String(b.period_month).padStart(2,"0")}`;
          const ka = `${String(a.period_year).padStart(4,"0")}${String(a.period_month).padStart(2,"0")}`;
          return kb.localeCompare(ka);
        });

        setItems(list);

        const years = Array.from(new Set(list.map(r => r.period_year))).sort((a,b)=>b-a);
        if (years.length && !years.includes(Number(selectedYear))) {
          setSelectedYear(String(years[0]));
        }
      } catch (error) {
        setErrorMessage("No se pudieron cargar tus nóminas.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const years = useMemo(() => {
    const setYears = new Set(items.map(r => r.period_year));
    const arr = Array.from(setYears).sort((a,b)=>b-a);
    return arr.length ? arr : [new Date().getFullYear()];
  }, [items]);

  const filtered = useMemo(
    () => items.filter(r => String(r.period_year) === String(selectedYear)),
    [items, selectedYear]
  );

  const handleDownload = async (id) => {
    try {
      const response = await fetch(`${urlApi}/payrolls/${id}/download`, {
        headers: { ...headersAuth },
      });
      if (!response.ok) throw new Error("No se pudo descargar la nómina.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `nomina_${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo descargar la nómina.");
    }
  };

  return (
    <section className="content-area">
      <div className="content-header">
        <div className="content-title">Nóminas</div>
        <div className="content-subtitle">Ver y descargar tus nóminas en PDF</div>
      </div>

      <div className="content-body">
        <div className="history-section">
          <div className="history-header">
            <div className="section-title">Historial de nóminas</div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="year-select"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ padding: 16, opacity: 0.7 }}>Cargando…</div>
            ) : errorMessage ? (
              <div style={{ padding: 16, color: "#b91c1c" }}>{errorMessage}</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 16, opacity: 0.7 }}>
                No hay nóminas para {selectedYear}.
              </div>
            ) : (
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Bruto</th>
                    <th>Deducciones</th>
                    <th>Líquido a percibir</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id}>
                      <td>
                        <div className="period-cell">
                          <div className="period-name">
                            {periodLabel(row.period_year, row.period_month)}
                          </div>
                          {row.uploaded_at ? (
                            <div className="period-date">
                              {new Date(row.uploaded_at).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="amount-cell">{row.gross || "—"}</td>
                      <td className="amount-cell">{row.deductions || "—"}</td>
                      <td className="net-pay-cell">{row.net || "—"}</td>
                      <td><span className="status-badge">{row.status}</span></td>
                      <td>
                        <button
                          type="button"
                          className="download-link"
                          onClick={() => handleDownload(row.id)}
                          title={row.original_filename || "Descargar nómina"}
                        >
                          <Download size={14} /> Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};



