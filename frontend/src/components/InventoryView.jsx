import React, { useState } from 'react';
import {
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    AlertCircle,
    CheckCircle2,
    ArrowUpDown,
    Download
} from 'lucide-react';

const InventoryView = () => {
    // Mock Data based on Prisma Schema (Item, Category, InventoryBatch)
    const [products] = useState([
        {
            id: '1',
            code: 'BRK-PAD-001',
            name: 'Ceramic Brake Pads (Front)',
            category: 'Braking System',
            stock: 45,
            reorderPoint: 10,
            costPrice: 850,
            sellingPrice: 1200,
            status: 'ACTIVE',
            lastUpdated: '2 hours ago'
        },
        {
            id: '2',
            code: 'OIL-SYN-5W30',
            name: 'Synthetic Engine Oil 5W-30',
            category: 'Fluids & Lubricants',
            stock: 8,
            reorderPoint: 15,
            costPrice: 450,
            sellingPrice: 650,
            status: 'ACTIVE',
            lastUpdated: '1 day ago'
        },
        {
            id: '3',
            code: 'FLT-AIR-002',
            name: 'High Performance Air Filter',
            category: 'Filters',
            stock: 120,
            reorderPoint: 20,
            costPrice: 300,
            sellingPrice: 550,
            status: 'ACTIVE',
            lastUpdated: '3 days ago'
        },
        {
            id: '4',
            code: 'SPK-PLG-IR',
            name: 'Iridium Spark Plug',
            category: 'Ignition',
            stock: 0,
            reorderPoint: 30,
            costPrice: 150,
            sellingPrice: 280,
            status: 'INACTIVE',
            lastUpdated: '1 week ago'
        },
        {
            id: '5',
            code: 'WPR-BLD-22',
            name: 'All-Weather Wiper Blade 22"',
            category: 'Exterior',
            stock: 25,
            reorderPoint: 5,
            costPrice: 200,
            sellingPrice: 350,
            status: 'ACTIVE',
            lastUpdated: '5 hours ago'
        }
    ]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Track stock levels, prices, and product details.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
                        <Download size={18} />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#033543] text-white rounded-xl hover:bg-[#054b5e] transition-all shadow-lg shadow-[#033543]/20 hover:shadow-[#033543]/30 active:scale-95 font-medium text-sm">
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Products" value="1,240" color="blue" />
                <StatCard label="Total Value" value="₹ 4.2L" color="emerald" />
                <StatCard label="Low Stock Items" value="12" color="amber" />
                <StatCard label="Out of Stock" value="3" color="red" />
            </div>

            {/* Filters & Table Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, code, or category..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#033543]/10 focus:border-[#033543] transition-all"
                        />
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
                            <Filter size={16} />
                            Filters
                        </button>
                        <select className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:border-[#033543]">
                            <option>All Categories</option>
                            <option>Braking</option>
                            <option>Engine</option>
                            <option>Fluids</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[40px]">
                                    <input type="checkbox" className="rounded border-slate-300 text-[#033543] focus:ring-[#033543]" />
                                </th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Product Info
                                        <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                                        Stock
                                        <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price (Sell)</th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="p-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded border-slate-300 text-[#033543] focus:ring-[#033543]" />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800 text-sm">{product.name}</span>
                                            <span className="text-xs text-slate-400 font-mono mt-0.5">{product.code}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${product.stock === 0 ? 'bg-red-500' :
                                                    product.stock <= product.reorderPoint ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                }`}></div>
                                            <span className={`text-sm font-medium ${product.stock <= product.reorderPoint ? 'text-amber-600' : 'text-slate-700'
                                                }`}>
                                                {product.stock} Units
                                            </span>
                                        </div>
                                        {product.stock <= product.reorderPoint && (
                                            <span className="text-[10px] text-red-500 font-medium block mt-1">
                                                Low Stock (Min: {product.reorderPoint})
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="font-semibold text-slate-700 text-sm">₹ {product.sellingPrice}</span>
                                        <span className="block text-[10px] text-slate-400">Cost: ₹ {product.costPrice}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${product.status === 'ACTIVE'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}>
                                            {product.status === 'ACTIVE' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-white bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-900">1-5</span> of <span className="font-semibold text-slate-900">124</span> items</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                            Previous
                        </button>
                        <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for Stats
const StatCard = ({ label, value, color }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50',
        red: 'text-red-600 bg-red-50',
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{label}</h4>
            <div className={`text-2xl font-bold ${colors[color].split(' ')[0]}`}>{value}</div>
        </div>
    );
};

export default InventoryView;
