
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { user } = useAuth();
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
  
  const handleRealtimeUpdate = useCallback((payload, state, setter) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      let updatedState = [...state];

      if (eventType === 'INSERT') {
          updatedState.push(newRecord);
      } else if (eventType === 'UPDATE') {
          updatedState = updatedState.map(item => item.id === newRecord.id ? newRecord : item);
      } else if (eventType === 'DELETE') {
          updatedState = updatedState.filter(item => item.id !== oldRecord.id);
      }
      setter(updatedState);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const tables = {
        residents: setResidents,
        prescriptions: setPrescriptions,
        nursing_care: setNursingCare,
        basic_care: setBasicCare,
        vital_signs: setVitalSigns,
        medication_stock: setMedicationStock,
        alerts: setAlerts,
        evolutions: setEvolutions,
        user_profiles: setUsers
    };

    const promises = Object.entries(tables).map(async ([tableName, setter]) => {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
            toast({ title: `Erro ao carregar ${tableName}`, description: error.message, variant: 'destructive' });
        } else {
            setter(data);
        }
    });

    await Promise.all(promises);
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    if (!user) return;
  
    const subscriptions = [
      { table: 'residents', setter: setResidents, state: residents },
      { table: 'prescriptions', setter: setPrescriptions, state: prescriptions },
      { table: 'nursing_care', setter: setNursingCare, state: nursingCare },
      { table: 'basic_care', setter: setBasicCare, state: basicCare },
      { table: 'vital_signs', setter: setVitalSigns, state: vitalSigns },
      { table: 'medication_stock', setter: setMedicationStock, state: medicationStock },
      { table: 'alerts', setter: setAlerts, state: alerts },
      { table: 'evolutions', setter: setEvolutions, state: evolutions },
      { table: 'user_profiles', setter: setUsers, state: users },
    ];
  
    const channels = subscriptions.map(({ table, setter, state }) =>
      supabase.channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => handleRealtimeUpdate(payload, state, setter))
        .subscribe()
    );
  
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, handleRealtimeUpdate, residents, prescriptions, nursingCare, basicCare, vitalSigns, medicationStock, alerts, evolutions, users]);

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

  const addOrUpdatePrescription = async (residentId, newItems) => {
     const { data: existing } = await supabase.from('prescriptions').select('id, items').eq('resident_id', residentId).single();
     if(existing) {
        const updatedItems = [...(existing.items || []), ...newItems];
        const { error } = await supabase.from('prescriptions').update({ items: updatedItems, updated_at: new Date(), updated_by: user.id }).eq('id', existing.id);
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
     } else {
        const { error } = await supabase.from('prescriptions').insert({ resident_id: residentId, items: newItems, created_by: user.id });
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
  
  const updateNursingCarePeriod = async (careId, date, period, userName) => {
    const { data: care } = await supabase.from('nursing_care').select('daily_records').eq('id', careId).single();
    if (care) {
      const dailyRecords = care.daily_records || {};
      const dayRecord = dailyRecords[date] || {};
      dayRecord[period] = { completed: true, completedAt: new Date().toISOString(), completedBy: userName };
      dailyRecords[date] = dayRecord;
      const { error } = await supabase.from('nursing_care').update({ daily_records: dailyRecords }).eq('id', careId);
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };
  
  const addEvolution = async (evolution) => {
    const { error } = await supabase.from('evolutions').insert(evolution);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };

  const addOrUpdateBasicCare = async (careData) => {
    const date = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('basic_care').select('id').eq('resident_id', careData.resident_id).eq('date', date).single();
    if (existing) {
        const { error } = await supabase.from('basic_care').update({ ...careData, updated_at: new Date() }).eq('id', existing.id);
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
        const { error } = await supabase.from('basic_care').insert({ ...careData, date: date });
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };
  
  const addOrUpdateVitalSigns = async (recordId, signs) => {
    let result;
    if (recordId) {
        const { data, error } = await supabase.from('vital_signs').update({ ...signs, updated_at: new Date() }).eq('id', recordId).select().single();
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        result = data;
    } else {
        const { data, error } = await supabase.from('vital_signs').insert({ ...signs, date: new Date().toISOString().split('T')[0] }).select().single();
        if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        result = data;
    }
    return result;
  };
  
  const addAlert = async (alert) => {
    const { error } = await supabase.from('alerts').insert(alert);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };
  
  const markAlertAsRead = async (alertId) => {
    const { error } = await supabase.from('alerts').update({ read: true }).eq('id', alertId);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };

  const addMedication = async (medData) => {
    const { error } = await supabase.from('medication_stock').insert({ ...medData, quantity: 0, movements: [] });
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };

  const updateMedication = async (medId, medData) => {
    const { error } = await supabase.from('medication_stock').update(medData).eq('id', medId);
    if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };

  const updateMedicationStock = async (medId, amount, reason) => {
    const { data: med } = await supabase.from('medication_stock').select('quantity, movements').eq('id', medId).single();
    if (med) {
      const newQuantity = (med.quantity || 0) + amount;
      const newMovement = { amount, reason, user: user?.profile?.name, date: new Date().toISOString() };
      const newMovements = [...(med.movements || []), newMovement];
      const { error } = await supabase.from('medication_stock').update({ quantity: newQuantity, movements: newMovements }).eq('id', medId);
      if(error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };
  
  const addUser = async (userData) => {
    const { data: { user: newUser }, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          cpf_cnpj: userData.cpf_cnpj,
          occupation: userData.occupation,
          professional_register: userData.professional_register
        }
      }
    });

    if (error) {
      toast({ title: 'Erro ao cadastrar usuário', description: error.message, variant: 'destructive' });
      return null;
    }
    return newUser;
  };
  
  const updateUser = async (userId, userData) => {
    const { error } = await supabase.from('user_profiles').update({
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        cpf_cnpj: userData.cpf_cnpj,
        occupation: userData.occupation,
        professional_register: userData.professional_register
    }).eq('id', userId);

    if (error) toast({ title: 'Erro ao atualizar usuário', description: error.message, variant: 'destructive' });
  };
  
  const deleteUser = async (userId) => {
    // Note: Deleting from auth.users requires admin privileges not available on the client.
    // This will only delete the profile, orphaning the auth user.
    // Proper deletion requires a server-side function (Edge Function) with the service_role key.
    const { error } = await supabase.from('user_profiles').delete().eq('id', userId);
    if (error) toast({ title: 'Erro ao remover usuário', description: error.message, variant: 'destructive' });
  };

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
