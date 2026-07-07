import React from 'react';
import { Phone, Mail, MapPin, User, Edit, Trash2, FileText, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_COLORS = {
  'Repair Shop': 'bg-blue-100 text-blue-700',
  'Parts Supplier': 'bg-purple-100 text-purple-700',
  'Tire Shop': 'bg-amber-100 text-amber-700',
  'Towing': 'bg-red-100 text-red-700',
  'Fuel': 'bg-green-100 text-green-700',
  'Body Shop': 'bg-indigo-100 text-indigo-700',
  'DEF/Emissions': 'bg-teal-100 text-teal-700',
  'Weigh Scale': 'bg-orange-100 text-orange-700',
  'Other': 'bg-slate-100 text-slate-600',
};

const STATUS_DOT = {
  active: 'bg-green-500',
  inactive: 'bg-slate-400',
  pending: 'bg-amber-400',
};

export default function VendorCard({ vendor, onEdit, onDelete, onSelect, selected }) {
  return (
    <div
      onClick={() => onSelect(vendor)}
      className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selected ? 'border-amber-400 ring-2 ring-amber-200 shadow-md' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[vendor.status]}`} />
            <h3 className="font-bold text-slate-900 text-sm truncate">{vendor.name}</h3>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${TYPE_COLORS[vendor.type] || 'bg-slate-100 text-slate-600'}`}>
            {vendor.type}
          </span>
        </div>
        <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => onEdit(vendor)} className="h-7 w-7 p-0">
            <Edit className="w-3.5 h-3.5 text-slate-400" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(vendor.id)} className="h-7 w-7 p-0">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-slate-600">
        {vendor.poc_name && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>{vendor.poc_name}{vendor.poc_title ? ` — ${vendor.poc_title}` : ''}</span>
          </div>
        )}
        {vendor.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <a href={`tel:${vendor.phone}`} className="hover:text-amber-600" onClick={e => e.stopPropagation()}>{vendor.phone}</a>
            {vendor.alt_phone && <span className="text-slate-400">/ {vendor.alt_phone}</span>}
          </div>
        )}
        {vendor.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <a href={`mailto:${vendor.email}`} className="hover:text-amber-600 truncate" onClick={e => e.stopPropagation()}>{vendor.email}</a>
          </div>
        )}
        {(vendor.city || vendor.state) && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>{[vendor.city, vendor.state, vendor.zip].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {vendor.contract_number && (
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-amber-700 font-medium">{vendor.contract_number}</span>
            {vendor.labor_rate && <span className="text-slate-400">· ${vendor.labor_rate}/hr</span>}
          </div>
        )}
        {vendor.type === 'Weigh Scale' && (
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
            <span className="font-medium text-orange-700">
              {vendor.scale_certified ? '✓ DOT Certified' : 'Scale'}
              {vendor.scale_max_capacity_lbs ? ` · ${vendor.scale_max_capacity_lbs.toLocaleString()} lb max` : ''}
              {vendor.scale_fee ? ` · $${vendor.scale_fee}/weigh` : ''}
            </span>
          </div>
        )}
        {vendor.type === 'Weigh Scale' && vendor.scale_hours && (
          <div className="text-xs text-slate-400">⏰ {vendor.scale_hours}</div>
        )}
      </div>

      {vendor.notes && (
        <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 line-clamp-2">{vendor.notes}</p>
      )}
    </div>
  );
}