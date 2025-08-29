import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { user, displayName } = useAuth();
  const [residents, setResidents] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [nursingCare, setNursingCare] = useState([]);
  const [basicCare, setBasicCare] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [medicationStock, setMedicationStock] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [evolutions, setEvolutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async (table, setter) => {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      toast({ title: `Erro ao carregar ${table}`, description: error.message, variant: 'destructive' });
    } else {
      setter(data);
    }
  }, [toast]);
  
  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) {
        toast({ title: 'Erro ao carregar usuários', description: error.message, variant: 'destructive' });
    } else {
        setUsers(data);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchData('residents', setResidents),
        fetchData('prescriptions', setPrescriptions),
        fetchData('nursing_care', setNursingCare),
        fetchData('basic_care', setBasicCare),
        fetchData('vital_signs', setVitalSigns),
        fetchData('medication_stock', setMedicationStock),
        fetchData('alerts', setAlerts),
        fetchData('evolutions', setEvolutions),
        fetchUsers()
      ]).finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [user, fetchData, fetchUsers]);

  // Handlers for real-time updates
  useEffect(() => {
    if (!user) return;

    const handleInserts = (payload, setter, state) => {
      setter([ ...state, payload.new ]);
    };
    const handleUpdates = (payload, setter, state) => {
      setter(state.map(item => item.id === payload.new.id ? payload.new : item));
    };
    const handleDeletes = (payload, setter, state) => {
      setter(state.filter(item => item.id !== payload.old.id));
    };

    const subscriptions = [
      { table: 'residents', state: residents, setter: setResidents },
      { table: 'prescriptions', state: prescriptions, setter: setPrescriptions },
      { table: 'nursing_care', state: nursingCare, setter: setNursingCare },
      { table: 'basic_care', state: basicCare, setter: setBasicCare },
      { table: 'vital_signs', state: vitalSigns, setter: setVitalSigns },
      { table: 'medication_stock', state: medicationStock, setter: setMedicationStock },
      { table: 'alerts', state: alerts, setter: setAlerts },
      { table: 'evolutions', state: evolutions, setter: setEvolutions },
      { table: 'user_profiles', state: users, setter: setUsers },
    ];

    const channels = subscriptions.map(({ table, state, setter }) => 
      supabase.channel(`public:${table}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => handleInserts(payload, setter, state))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, (payload) => handleUpdates(payload, setter, state))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, (payload) => handleDeletes(payload, setter, state))
        .subscribe()
    );

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, residents, prescriptions, nursingCare, basicCare, vitalSigns, medicationStock, alerts, evolutions, users]);

  const addResident = async (resident) => {
    const { data, error } = await supabase.from('residents').insert(resident).select().single();
    if(error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return null; }
    return data;
  };

  const updateResident = async (id, updatedData) => {
    const { data, error } = await supabase.from('residents').update(updatedData).eq('id', id);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };
  
  const deleteResident = async (residentId) => {
    const { error } = await supabase.from('residents').delete().eq('id', residentId);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: 'Residente Excluído', description: 'O residente e todos os seus dados foram removidos.'});
  };

  const addOrUpdatePrescription = async (residentId, prescriptionData) => {
     const { data: existing } = await supabase.from('prescriptions').select('id, items').eq('resident_id', residentId).single();
     if(existing) {
        const updatedItems = [...(existing.items || []), ...prescriptionData.items];
        const { error } = await supabase.from('prescriptions').update({ items: updatedItems, updated_at: new Date(), updated_by: user.id }).eq('id', existing.id);
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
     } else {
        const { error } = await supabase.from('prescriptions').insert({ resident_id: residentId, items: prescriptionData.items, created_by: user.id });
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
     }
  };

  const updatePrescriptionItem = async (residentId, itemId, itemData) => {
    const { data: pres } = await supabase.from('prescriptions').select('items').eq('resident_id', residentId).single();
    if (pres) {
      const updatedItems = pres.items.map(i => i.id === itemId ? { ...i, ...itemData } : i);
      const { error } = await supabase.from('prescriptions').update({ items: updatedItems }).eq('resident_id', residentId);
      if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const deletePrescriptionItem = async (residentId, itemId) => {
    const { data: pres } = await supabase.from('prescriptions').select('items').eq('resident_id', residentId).single();
    if (pres) {
      const updatedItems = pres.items.filter(i => i.id !== itemId);
      const { error } = await supabase.from('prescriptions').update({ items: updatedItems }).eq('resident_id', residentId);
      if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const updatePrescriptionItemStatus = async (residentId, itemId, date, completed, currentUser) => {
     const { data: pres } = await supabase.from('prescriptions').select('daily_records').eq('resident_id', residentId).single();
     if(pres) {
        const dailyRecords = pres.daily_records || {};
        const dayRecord = dailyRecords[date] || {};
        dayRecord[itemId] = { completed, completedAt: new Date().toISOString(), completedBy: currentUser.profile.name, userId: currentUser.id };
        dailyRecords[date] = dayRecord;
        const { error } = await supabase.from('prescriptions').update({ daily_records: dailyRecords }).eq('resident_id', residentId);
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
     }
  };

  const addNursingCare = async (care) => {
    const { error } = await supabase.from('nursing_care').insert(care);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };
  
  const addEvolution = async (evolution) => {
    const { error } = await supabase.from('evolutions').insert(evolution);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };
  
  const addOrUpdateVitalSigns = async (signs) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('vital_signs').select('id').eq('resident_id', signs.residentId).eq('date', today).single();
    if (existing) {
        const { error } = await supabase.from('vital_signs').update({ ...signs, updatedAt: new Date() }).eq('id', existing.id);
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
        const { error } = await supabase.from('vital_signs').insert({ ...signs, date: today });
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };
  
  const addAlert = async (alert) => {
    const { error } = await supabase.from('alerts').insert(alert);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };
  
  const markAlertAsRead = async (alertId) => {
    const { error } = await supabase.from('alerts').update({ read: true }).eq('id', alertId);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };

  // Dummy functions to avoid breaking the UI for now
  const updateUser = () => console.log("updateUser not implemented for Supabase yet");
  const deleteUser = () => console.log("deleteUser not implemented for Supabase yet");
  const updateNursingCarePeriod = () => console.log("updateNursingCarePeriod not implemented for Supabase yet");
  const addOrUpdateBasicCare = () => console.log("addOrUpdateBasicCare not implemented for Supabase yet");
  const addMedication = () => console.log("addMedication not implemented for Supabase yet");
  const updateMedication = () => console.log("updateMedication not implemented for Supabase yet");
  const updateMedicationStock = () => console.log("updateMedicationStock not implemented for Supabase yet");
  const addUser = () => console.log("addUser not implemented for Supabase yet");


  const value = {
    loading,
    users, addUser, updateUser, deleteUser,
    residents, addResident, updateResident, deleteResident,
    prescriptions, addOrUpdatePrescription, updatePrescriptionItemStatus, deletePrescriptionItem, updatePrescriptionItem,
    nursingCare, addNursingCare, updateNursingCarePeriod,
    basicCare, addOrUpdateBasicCare,
    vitalSigns, addOrUpdateVitalSigns,
    medicationStock, addMedication, updateMedication, updateMedicationStock,
    alerts, addAlert, markAlertAsRead,
    evolutions, addEvolution
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}