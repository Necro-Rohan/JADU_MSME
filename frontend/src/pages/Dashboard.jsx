import React, { useState } from 'react';
import {
    LayoutDashboard,
    Package,
    Users,
    LogOut,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Mock Data for Charts
    const salesData = [
        { name: 'Premium', value: 35, color: '#0f172a' },
        { name: 'Mid-Range', value: 45, color: '#334155' },
        { name: 'Economy', value: 20, color: '#64748b' },
    ];

    const revenueData = [
        { name: 'Jan', revenue: 4000 },
        { name: 'Feb', revenue: 3000 },
        { name: 'Mar', revenue: 2000 },
        { name: 'Apr', revenue: 2780 },
        { name: 'May', revenue: 1890 },
        { name: 'Jun', revenue: 2390 },
    ];

    const customerData = [
        { name: 'New', value: 400 },
        { name: 'Returning', value: 300 },
        { name: 'Inactive', value: 300 },
    ];

    return (
        <div className="flex h-screen bg-slate-100 text-slate-900 font-sans">

            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 flex-shrink-0">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400"></div>
                    <h1 className="text-xl font-bold tracking-wide">AutoKarya</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-2">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={<Package size={20} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
                    <SidebarItem icon={<Users size={20} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
                </nav>

                {/* User Profile / Logout */}
                <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold">JD</div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold">Jadu</div>
                            <div className="text-xs text-slate-400">Admin</div>
                        </div>
                        <LogOut size={18} className="text-slate-400 cursor-pointer hover:text-white transition-colors" />
                    </div>
                    <div className="text-[10px] text-slate-500 text-center">
                        &copy; 2024 AutoKarya. All rights reserved.
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">

                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <LayoutDashboard className="text-slate-900" size={32} />
                            Dashboard
                        </h1>
                        <p className="text-slate-500 mt-2">Here you can get insights about your products</p>
                    </div>
                </header>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <MetricCard title="Revenue" value="2,375,776.85 ₹" trend="+12%" />
                    <MetricCard title="Sales Amount" value="10,821 ₹" trend="-2%" negative />
                    <MetricCard title="Customers" value="20" trend="+5%" />
                </div>

                {/* Charts Section 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* Best Seller */}
                    <div className="bg-slate-800 text-white rounded-xl overflow-hidden flex flex-col shadow-sm">
                        <div className="p-6">
                            <h3 className="text-base font-semibold mb-4">Best Seller</h3>
                            <div className="bg-white rounded-xl p-4 flex items-center gap-4 text-slate-900">
                                <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <Package className="text-slate-800" size={32} />
                                </div>
                                <div>
                                    <div className="font-bold text-lg">Sound System</div>
                                    <div className="text-slate-500 text-sm">(4225.92₹)</div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto bg-slate-900 p-6 text-center">
                            <h2 className="text-3xl font-bold">961 Sales</h2>
                        </div>
                    </div>

                    {/* Revenue By Segment */}
                    <ChartCard title="Revenue by Segment">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={salesData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {salesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 text-xs mt-4 text-slate-500">
                            {salesData.map((item) => (
                                <div key={item.name} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    </ChartCard>

                    {/* Quantity by Segment */}
                    <ChartCard title="Quantity of Sales by Segment">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={salesData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    <Cell fill="#60a5fa" />
                                    <Cell fill="#1e293b" />
                                    <Cell fill="#94a3b8" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* Charts Section 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Revenue per Product (Grouped by Category)">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={revenueData}>
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="revenue" fill="#334155" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Customer distribution by Gender">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={customerData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                                    <Cell fill="#334155" />
                                    <Cell fill="#60a5fa" />
                                    <Cell fill="#94a3b8" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

            </main>
        </div>
    );
};

// Components

const SidebarItem = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${active
                ? 'bg-sky-400 text-slate-900 font-semibold shadow-md shadow-sky-400/20'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
    >
        {icon}
        <span>{label}</span>
    </div>
);

const MetricCard = ({ title, value, trend, negative }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">{title}</h3>
        <div className="text-2xl font-extrabold text-slate-900 mb-2">{value}</div>
        {trend && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${negative ? 'text-red-500' : 'text-emerald-500'}`}>
                {negative ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                <span>{trend}</span>
            </div>
        )}
    </div>
);

const ChartCard = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-6">{title}</h3>
        {children}
    </div>
);

export default Dashboard;
