import React, { useState } from "react";
import { Plus, Edit2, Trash2, Home, MapPin, Users, ChevronRight, X, ArrowLeft } from "lucide-react";
import { Condominium, CondoUnit } from "../types";
import { motion } from "motion/react";

interface CondosTabProps {
  condos: Condominium[];
  onAddCondo: (name: string, address: string, units: CondoUnit[]) => Promise<void>;
  onUpdateCondo: (id: string, name: string, address: string, units: CondoUnit[]) => Promise<void>;
  onDeleteCondo: (id: string) => Promise<void>;
}

export default function CondosTab({ condos, onAddCondo, onUpdateCondo, onDeleteCondo }: CondosTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominium | null>(null);
  const [viewingCondo, setViewingCondo] = useState<Condominium | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [units, setUnits] = useState<CondoUnit[]>([]);

  // Temp Unit states
  const [tempUnitNum, setTempUnitNum] = useState("");
  const [tempOwnerName, setTempOwnerName] = useState("");
  const [tempOwnerEmail, setTempOwnerEmail] = useState("");
  const [tempOwnerPhone, setTempOwnerPhone] = useState("");

  const handleOpenAdd = () => {
    setName("");
    setAddress("");
    setUnits([]);
    setEditingCondo(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (condo: Condominium, e: React.MouseEvent) => {
    e.stopPropagation();
    setName(condo.name);
    setAddress(condo.address);
    setUnits([...condo.units]);
    setEditingCondo(condo);
    setIsFormOpen(true);
  };

  const handleAddUnit = () => {
    if (!tempUnitNum.trim() || !tempOwnerName.trim()) {
      alert("Por favor, preencha o número da unidade e o nome do proprietário.");
      return;
    }
    // Check duplication
    if (units.some(u => u.number === tempUnitNum.trim())) {
      alert("Essa unidade já está cadastrada para este condomínio.");
      return;
    }

    const newUnit: CondoUnit = {
      number: tempUnitNum.trim(),
      ownerName: tempOwnerName.trim(),
      ownerEmail: tempOwnerEmail.trim(),
      ownerPhone: tempOwnerPhone.trim()
    };

    setUnits([...units, newUnit]);
    // Reset temp inputs
    setTempUnitNum("");
    setTempOwnerName("");
    setTempOwnerEmail("");
    setTempOwnerPhone("");
  };

  const handleRemoveUnit = (num: string) => {
    setUnits(units.filter(u => u.number !== num));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("O nome do condomínio é obrigatório.");
      return;
    }

    try {
      if (editingCondo) {
        await onUpdateCondo(editingCondo.id, name, address, units);
      } else {
        await onAddCondo(name, address, units);
      }
      setIsFormOpen(false);
      // If we are currently viewing the condo that was edited, update the view state
      if (viewingCondo && editingCondo && viewingCondo.id === editingCondo.id) {
        setViewingCondo({ ...viewingCondo, name, address, units });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="condos-tab-container" className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-[#e5e5d1] shadow-xs">
        <div>
          <h2 id="condos-title" className="text-2xl font-semibold tracking-tight text-[#2d2d24]">Condomínios</h2>
          <p className="text-sm text-[#8c8c7a] mt-1">Cadastre e gerencie as unidades e proprietários de cada condomínio.</p>
        </div>
        <button
          id="btn-add-condo"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5a5a40] hover:bg-[#4a4a33] text-white font-medium text-sm rounded-xl transition shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          Novo Condomínio
        </button>
      </div>

      {/* VIEW DETAILS VIEW */}
      {viewingCondo && !isFormOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#e5e5d1] shadow-xs overflow-hidden"
        >
          <div className="bg-[#f8f8f2] border-b border-[#e5e5d1] p-6 flex justify-between items-center">
            <button 
              id="btn-back-to-condos"
              onClick={() => setViewingCondo(null)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#5a5a40] hover:text-[#2d2d24] transition"
            >
              <ArrowLeft size={16} />
              Voltar para lista
            </button>
            <div className="flex gap-2">
              <button
                id={`btn-edit-condo-${viewingCondo.id}`}
                onClick={(e) => handleOpenEdit(viewingCondo, e)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#dcdcc6] hover:border-[#5a5a40] text-[#4a4a40] hover:text-[#2d2d24] font-medium text-xs rounded-lg transition bg-white"
              >
                <Edit2 size={13} />
                Editar Condomínio
              </button>
              <button
                id={`btn-delete-condo-${viewingCondo.id}`}
                onClick={async () => {
                  if (confirm(`Tem certeza que deseja excluir o condomínio "${viewingCondo.name}"? Todas as despesas e mensalidades associadas serão apagadas.`)) {
                    await onDeleteCondo(viewingCondo.id);
                    setViewingCondo(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5e2e2] hover:bg-[#ebd0d0] text-red-700 font-medium text-xs rounded-lg transition"
              >
                <Trash2 size={13} />
                Excluir
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-[#2d2d24]">{viewingCondo.name}</h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-[#8c8c7a]">
                <MapPin size={16} className="text-[#a0a08b] shrink-0" />
                <span>{viewingCondo.address || "Endereço não cadastrado"}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-[#2d2d24] flex items-center gap-2">
                  <Users size={18} className="text-[#5a5a40]" />
                  Unidades Cadastradas ({viewingCondo.units.length})
                </h4>
              </div>

              {viewingCondo.units.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#dcdcc6] rounded-xl bg-[#f8f8f2]">
                  <p className="text-[#8c8c7a] text-sm">Este condomínio ainda não possui nenhuma unidade cadastrada.</p>
                  <button
                    onClick={(e) => handleOpenEdit(viewingCondo, e)}
                    className="mt-3 text-[#5a5a40] hover:text-[#4a4a33] font-medium text-xs underline"
                  >
                    Adicionar Unidades agora
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#e5e5d1]">
                  <table className="w-full text-left text-sm text-[#4a4a40]">
                    <thead className="bg-[#f8f8f2] text-xs text-[#2d2d24] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3 border-b border-[#e5e5d1]">Unidade</th>
                        <th className="px-6 py-3 border-b border-[#e5e5d1]">Proprietário</th>
                        <th className="px-6 py-3 border-b border-[#e5e5d1]">E-mail</th>
                        <th className="px-6 py-3 border-b border-[#e5e5d1]">Telefone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5d1]">
                      {viewingCondo.units.map((unit) => (
                        <tr key={unit.number} className="hover:bg-[#f8f8f2]/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-[#2d2d24] bg-[#ecece4]/25">{unit.number}</td>
                          <td className="px-6 py-4 font-medium text-[#2d2d24]">{unit.ownerName}</td>
                          <td className="px-6 py-4 text-[#4a4a40]">{unit.ownerEmail || "-"}</td>
                          <td className="px-6 py-4 text-[#4a4a40]">{unit.ownerPhone || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* FORM MODAL/DRAWER (ADD / EDIT) */}
      {isFormOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-[#e5e5d1] shadow-md space-y-6"
        >
          <div className="flex justify-between items-center border-b border-[#e5e5d1] pb-4">
            <h3 id="form-condo-title" className="text-lg font-semibold text-[#2d2d24]">
              {editingCondo ? "Editar Condomínio" : "Cadastrar Novo Condomínio"}
            </h3>
            <button 
              id="btn-close-form"
              onClick={() => setIsFormOpen(false)}
              className="text-[#8c8c7a] hover:text-[#5a5a40] transition"
            >
              <X size={20} />
            </button>
          </div>

          <form id="form-condo" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4a4a40]">Nome do Condomínio *</label>
                <input
                  id="input-condo-name"
                  type="text"
                  required
                  placeholder="Ex: Condomínio Edifício Residencial Jardins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#dcdcc6] rounded-lg text-sm focus:outline-hidden focus:border-[#5a5a40] focus:ring-2 focus:ring-[#ecece4] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#4a4a40]">Endereço</label>
                <input
                  id="input-condo-address"
                  type="text"
                  placeholder="Ex: Av. Paulista, 1200 - Bela Vista, São Paulo - SP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#dcdcc6] rounded-lg text-sm focus:outline-hidden focus:border-[#5a5a40] focus:ring-2 focus:ring-[#ecece4] transition"
                />
              </div>
            </div>

            {/* UNITS SECTION IN FORM */}
            <div className="border-t border-[#e5e5d1] pt-6 space-y-4">
              <h4 className="font-semibold text-[#2d2d24] text-sm flex items-center gap-1.5">
                <Home size={16} className="text-[#5a5a40]" />
                Configurar Unidades & Proprietários ({units.length})
              </h4>

              {/* Add Unit Inline Form */}
              <div className="bg-[#f8f8f2] p-4 rounded-xl border border-[#e5e5d1] space-y-4">
                <span className="text-xs font-semibold text-[#4a4a40] tracking-wider uppercase block">Adicionar Unidade à Lista</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#8c8c7a] font-medium">Unidade / Apto *</label>
                    <input
                      id="input-unit-number"
                      type="text"
                      placeholder="Ex: 101"
                      value={tempUnitNum}
                      onChange={(e) => setTempUnitNum(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#dcdcc6] rounded-md text-xs bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#8c8c7a] font-medium">Nome do Proprietário *</label>
                    <input
                      id="input-unit-owner"
                      type="text"
                      placeholder="Ex: João da Silva"
                      value={tempOwnerName}
                      onChange={(e) => setTempOwnerName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#dcdcc6] rounded-md text-xs bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#8c8c7a] font-medium">E-mail</label>
                    <input
                      id="input-unit-email"
                      type="email"
                      placeholder="Ex: joao@email.com"
                      value={tempOwnerEmail}
                      onChange={(e) => setTempOwnerEmail(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#dcdcc6] rounded-md text-xs bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#8c8c7a] font-medium">WhatsApp / Telefone</label>
                    <input
                      id="input-unit-phone"
                      type="text"
                      placeholder="Ex: (11) 98888-7777"
                      value={tempOwnerPhone}
                      onChange={(e) => setTempOwnerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#dcdcc6] rounded-md text-xs bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    id="btn-add-unit-to-list"
                    type="button"
                    onClick={handleAddUnit}
                    className="px-4 py-1.5 bg-[#5a5a40] hover:bg-[#4a4a33] text-white rounded-md text-xs font-medium transition cursor-pointer"
                  >
                    Adicionar à Lista
                  </button>
                </div>
              </div>

              {/* Units List inside the form */}
              {units.length > 0 ? (
                <div className="border border-[#e5e5d1] rounded-xl max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8f8f2] text-[#2d2d24] font-semibold sticky top-0">
                      <tr>
                        <th className="px-4 py-2 border-b border-[#e5e5d1]">Unidade</th>
                        <th className="px-4 py-2 border-b border-[#e5e5d1]">Proprietário</th>
                        <th className="px-4 py-2 border-b border-[#e5e5d1]">E-mail</th>
                        <th className="px-4 py-2 border-b border-[#e5e5d1]">Telefone</th>
                        <th className="px-4 py-2 border-b border-[#e5e5d1] text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5d1] bg-white">
                      {units.map((u) => (
                        <tr key={u.number} className="hover:bg-[#f8f8f2]">
                          <td className="px-4 py-2 font-semibold text-[#2d2d24]">{u.number}</td>
                          <td className="px-4 py-2 text-[#4a4a40]">{u.ownerName}</td>
                          <td className="px-4 py-2 text-[#8c8c7a]">{u.ownerEmail || "-"}</td>
                          <td className="px-4 py-2 text-[#8c8c7a]">{u.ownerPhone || "-"}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveUnit(u.number)}
                              className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-[#dcdcc6] rounded-xl text-[#8c8c7a] text-xs bg-[#f8f8f2]/30">
                  Nenhuma unidade adicionada ainda. Use o painel acima para adicionar as unidades do condomínio.
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 border-t border-[#e5e5d1] pt-4">
              <button
                id="btn-cancel-condo"
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-[#dcdcc6] text-[#4a4a40] text-sm font-medium rounded-xl hover:bg-[#f8f8f2] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-save-condo"
                type="submit"
                className="px-5 py-2 bg-[#5a5a40] hover:bg-[#4a4a33] text-white text-sm font-medium rounded-xl transition shadow-sm cursor-pointer"
              >
                {editingCondo ? "Salvar Alterações" : "Criar Condomínio"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* CONDOS LIST GRID */}
      {!viewingCondo && !isFormOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {condos.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-white border border-[#e5e5d1] rounded-2xl">
              <p className="text-[#8c8c7a] font-medium">Nenhum condomínio cadastrado no sistema.</p>
              <button
                onClick={handleOpenAdd}
                className="mt-4 text-[#5a5a40] font-medium hover:text-[#4a4a33] flex items-center gap-1.5 mx-auto text-sm cursor-pointer underline"
              >
                <Plus size={16} /> Cadastre o primeiro condomínio
              </button>
            </div>
          ) : (
            condos.map((condo) => (
              <motion.div
                key={condo.id}
                id={`condo-card-${condo.id}`}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                onClick={() => setViewingCondo(condo)}
                className="bg-white p-6 rounded-2xl border border-[#e5e5d1] hover:border-[#5a5a40] hover:shadow-xs cursor-pointer transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-[#2d2d24] text-lg leading-snug hover:text-[#5a5a40] transition">
                      {condo.name}
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm text-[#4a4a40]">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#a0a08b] shrink-0" />
                      <span className="truncate">{condo.address || "Endereço não informado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#a0a08b] shrink-0" />
                      <span>{condo.units.length} Unidades Cadastradas</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#e5e5d1] mt-6 pt-4 flex justify-between items-center text-xs">
                  <span className="text-[#8c8c7a] font-mono">ID: {condo.id}</span>
                  <span className="font-semibold text-[#5a5a40] flex items-center gap-0.5 group">
                    Ver detalhes e unidades <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
