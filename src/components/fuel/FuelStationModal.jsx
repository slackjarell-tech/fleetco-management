import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import moment from "moment";

const AMENITIES = [
  "Truck Parking", "Showers", "Restaurant", "Convenience Store",
  "Tire Shop", "Scale", "Lounge", "Laundry", "WiFi", "ATM",
  "Truck Wash", "24/7"
];

export default function FuelStationModal({ open, onClose, station, currentUser }) {
  const [form, setForm] = useState({
    name: "", brand: "", address: "", city: "", state: "", zip: "",
    lat: "", lng: "", phone: "",
    diesel_price: "", gasoline_price: "", def_price: "",
    amenities: [], notes: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (station) {
      setForm({
        name: station.name || "",
        brand: station.brand || "",
        address: station.address || "",
        city: station.city || "",
        state: station.state || "",
        zip: station.zip || "",
        lat: station.lat?.toString() || "",
        lng: station.lng?.toString() || "",
        phone: station.phone || "",
        diesel_price: station.diesel_price?.toString() || "",
        gasoline_price: station.gasoline_price?.toString() || "",
        def_price: station.def_price?.toString() || "",
        amenities: station.amenities || [],
        notes: station.notes || ""
      });
    } else {
      setForm({
        name: "", brand: "", address: "", city: "", state: "", zip: "",
        lat: "", lng: "", phone: "",
        diesel_price: "", gasoline_price: "", def_price: "",
        amenities: [], notes: ""
      });
    }
  }, [station, open]);

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name: form.name,
      brand: form.brand,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      phone: form.phone,
      diesel_price: form.diesel_price ? parseFloat(form.diesel_price) : null,
      gasoline_price: form.gasoline_price ? parseFloat(form.gasoline_price) : null,
      def_price: form.def_price ? parseFloat(form.def_price) : null,
      amenities: form.amenities,
      notes: form.notes,
      last_updated_by: currentUser?.full_name || "Unknown",
      last_updated_date: new Date().toISOString()
    };

    if (station) {
      await api.entities.FuelStation.update(station.id, data);
      toast.success("Station updated");
    } else {
      await api.entities.FuelStation.create(data);
      toast.success("Station added");
    }
    onClose();
    setSaving(false);
  };

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{station ? "Edit Fuel Station" : "Add Fuel Station"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Station Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Station Name *</Label>
              <Input required value={form.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. Pilot Travel Center" />
            </div>
            <div>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={e => setField("brand", e.target.value)} placeholder="e.g. Pilot, Love's, TA" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setField("phone", e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setField("address", e.target.value)} placeholder="Street address" />
            </div>
            <div>
              <Label>City *</Label>
              <Input required value={form.city} onChange={e => setField("city", e.target.value)} placeholder="City" />
            </div>
            <div>
              <Label>State *</Label>
              <Input required value={form.state} onChange={e => setField("state", e.target.value)} placeholder="State" />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input value={form.zip} onChange={e => setField("zip", e.target.value)} placeholder="ZIP" />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Latitude</Label>
              <Input value={form.lat} onChange={e => setField("lat", e.target.value)} placeholder="39.8283" type="number" step="any" />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input value={form.lng} onChange={e => setField("lng", e.target.value)} placeholder="-98.5795" type="number" step="any" />
            </div>
          </div>

          {/* Fuel Prices */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Fuel Prices ($/gallon)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Diesel</Label>
                <Input value={form.diesel_price} onChange={e => setField("diesel_price", e.target.value)} placeholder="3.499" type="number" step="0.001" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Gasoline</Label>
                <Input value={form.gasoline_price} onChange={e => setField("gasoline_price", e.target.value)} placeholder="3.299" type="number" step="0.001" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">DEF</Label>
                <Input value={form.def_price} onChange={e => setField("def_price", e.target.value)} placeholder="3.99" type="number" step="0.01" />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                    form.amenities.includes(a)
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setField("notes", e.target.value)} placeholder="Any additional notes..." rows={2} />
          </div>

          {station && (
            <div className="text-xs text-slate-400">
              Last updated by {station.last_updated_by || "Unknown"} {moment(station.last_updated_date).fromNow()}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-slate-900">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {station ? "Update Station" : "Add Station"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}