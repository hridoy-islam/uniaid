import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Link, useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';

// Define validation schema
const agentSchema = z.object({
  sortCode: z.string().min(1, 'Sort code is required'),
  accountNo: z.string().min(1, 'Account number is required'),
  beneficiary: z.string().min(1, 'Beneficiary is required')
});

export default function AgentRemit() {
  const [agent, setAgent] = useState({});
  const { id } = useParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset
  } = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      sortCode: '',
      accountNo: '',
      beneficiary: ''
    }
  });

  // Fetch agent data
  const fetchAgentData = async () => {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      const agentData = response?.data?.data || {};
      setAgent(agentData);

      // Populate form fields with the fetched data
      reset({
        sortCode: agentData?.sortCode || '',
        accountNo: agentData?.accountNo || '',
        beneficiary: agentData?.beneficiary || ''
      });
    } catch (error) {
      toast({
        title: 'Error loading agent data',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, [id]);

  const onSubmit = async (data) => {
    try {
      await axiosInstance.patch(`/users/${id}`, data);
      toast({
        title: 'Record updated successfully',
        className: 'bg-supperagent border-none text-white'
      });
      fetchAgentData(); // Refresh data after update
    } catch (error) {
      toast({
        title: 'Error updating agent data',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="w-full rounded-lg bg-white p-6 shadow-sm">
        <div className="flex justify-between">
          <h1 className="mb-4 text-lg font-semibold text-gray-900">
            {agent.name}
          </h1>
          <Link to="/admin/agents">
            <Button
              className="bg-supperagent text-white hover:bg-supperagent/90"
              size={'sm'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back To Agents
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-5">
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Email:</span>
            <span className="text-gray-800">{agent?.email}</span>
          </div>

          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Phone:</span>
            <span className="text-gray-800">{agent?.phone}</span>
          </div>

          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Location:</span>
            <span className="text-gray-800">{agent?.location}</span>
          </div>

          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Organization:</span>
            <span className="text-gray-800">{agent?.organization}</span>
          </div>

          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-600">Contact Person:</span>
            <span className="text-gray-800">{agent?.contactPerson}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Agent Remit Details</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Sort Code */}
            <div className="space-y-2">
              <Label htmlFor="sortCode">Sort Code *</Label>
              <Input
                id="sortCode"
                {...register('sortCode')}
                placeholder="Enter sort code"
              />
              {errors.sortCode && (
                <p className="text-sm font-medium text-destructive">
                  {errors.sortCode.message}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNo">Account Number *</Label>
              <Input
                id="accountNo"
                {...register('accountNo')}
                placeholder="Enter account number"
              />
              {errors.accountNo && (
                <p className="text-sm font-medium text-destructive">
                  {errors.accountNo.message}
                </p>
              )}
            </div>

            {/* Beneficiary */}
            <div className="space-y-2">
              <Label htmlFor="beneficiary">Beneficiary *</Label>
              <Input
                id="beneficiary"
                {...register('beneficiary')}
                placeholder="Enter beneficiary"
              />
              {errors.beneficiary && (
                <p className="text-sm font-medium text-destructive">
                  {errors.beneficiary.message}
                </p>
              )}
            </div>
          </div>

          {isDirty && (
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-supperagent text-white hover:bg-supperagent/90"
                disabled={!isDirty}
              >
                Update Details
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
