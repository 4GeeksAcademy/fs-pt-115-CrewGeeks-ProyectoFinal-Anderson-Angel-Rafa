import React, { useState } from "react";
import { Download, Euro, Calculator, TrendingUp } from "lucide-react";
import "./EmployeePayroll.css";


export const EmployeePayroll = () => {
    const [selectedYear, setSelectedYear] = useState("2024");

    const earnings = [
        { label: "Salario base", amount: "€3,200.00" },
        { label: "Horas extra (8h)", amount: "€180.00" },
        { label: "Bono por rendimiento", amount: "€250.00" },
    ];

    const deductions = [
        { label: "IRPF", amount: "€654.00" },
        { label: "Seguridad Social", amount: "€290.40" },
        { label: "Seguro de Salud", amount: "€120.00" },
        { label: "Aporte a pension", amount: "€109.20" }
    ];
    const payrollHistory = [
        { period: "agosto de 2024", dateRange: "1 - 31 de agosto", gross: "€3,630.00", deductions: "€1,173.60", netPay: "€2,456.40", status: "Pagado" },
        { period: "julio de 2024", dateRange: "1 - 31 de julio", gross: "€3,200.00", deductions: "€1,088.00", netPay: "€2,112.00", status: "Pagado" },
        { period: "junio de 2024", dateRange: "1 - 30 de junio", gross: "€3,400.00", deductions: "€1,156.00", netPay: "€2,244.00", status: "Pagado" },


    ]

    return (
        <div className="payroll-container">
            <div className="payroll-header">
                <div>
                    <h1>Payroll</h1>
                    <p>Ver y administrar tu informacion salarial y tus desprendibles de nomina </p>
                </div>
                <button className="download-btn">
                    <Download size={18} />
                    Descarga lo mas reciente
                </button>
            </div>

            <div className="overview-cards">
                <div className="overview-card">
                    <div className="card-icon green">
                        <Euro size={24} />
                    </div>
                    <div>
                        <p className="card-label">Salario bruto</p>
                        <p className="card-amount">€3,200</p>
                        <p className="card-description">Salario base mensual</p>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="card-icon blue"><Calculator size={24} /></div>
                    <div>
                        <p className="card-label">Salario neto</p>
                        <p className="card-amount">€2,456</p>
                        <p className="card-description">Despues de impuestos y deducciones</p>
                    </div>
                </div>
                <div className="overview-card">
                    <div className="card-icon yellow"><TrendingUp size={24} /></div>
                    <div>
                        <p className="card-label">Acumulado anual</p>
                        <p className="card-amount">€19,648</p>
                        <p className="card-description">Enero - Agosto 2024</p>
                    </div>
                </div>
            </div>

            <div className="breakdown-section">
                <div className="breakdown-header">
                    <h2>Desglose de agosto 2024</h2>
                </div>
                <div className="breakdown-content">
                    <div className="breakdown-grid">
                        <div>
                            <div className="section-title">
                                <div className="status-dot green"></div>
                                <h3>Ingresos</h3>
                            </div>
                            <div className="item-list">
                                {earnings.map((item, i) => (
                                    <div key={i} className="item-row">
                                        <span className="item-label">{item.label}</span>
                                        <span className="item-amount">{item.amount}</span>
                                    </div>
                                ))}
                                <div className="item-row total-row">
                                    <span className="total-earnings">Total de ingresos</span>
                                    <span className="total-earnings">€3,630.00</span>
                                </div>
                            </div>
                        </div>

                        <div> 
                            <div className="section-title">
                                <div className="status-dot red"></div>
                                <h3>Deducciones</h3>
                            </div>
                            <div className="item-list">
                                {deductions.map((item, i) => (
                                    <div key={i} className="item-row">
                                        <span className="item-label">{item.label}</span>
                                        <span className="item-amount">{item.amount}</span>
                                    </div>
                                ))}
                                <div className="item-row total-row">
                                    <span className="total-deductions">Total de deducciones</span>
                                    <span className="total-deductions">€1,173.60</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="net-pay-section">
                        <div className="net-pay-card">
                            <div className="net-pay-row">
                                <span className="net-pay-label">Pago neto</span>
                                <span className="net-pay-amount">€2,456.40</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="history-section">
                <div className="history-header">
                    <h2>Historial de nominas</h2>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="year-select"
                    >
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                    </select>
                </div>

                <div className="table-container">
                    <table className="payroll-table">
                        <thead>
                            <tr>
                                <th>Periodo</th><th>Bruto</th><th>Deducciones</th><th>Líquido a percibir</th><th>Estado</th><th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollHistory.map((r, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="period-cell">
                                            <div className="period-name">{r.period}</div>
                                            <div className="period-date">{r.dateRange}</div>
                                        </div>
                                    </td>
                                    <td className="amount-cell">{r.gross} </td>
                                    <td className="amount-cell">{r.deductions}</td>
                                    <td className="net-pay-cell">{r.netPay}</td>
                                    <td><span className="status-badge">{r.status}</span></td>
                                    <td>
                                        <a href="#" className="download-link">
                                            <Download size={14} /> Descargar
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

