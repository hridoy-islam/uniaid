import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const BankDetailsPage = () => {
  const { id } = useParams();
  const [bank, setBank] = useState(null);
  const [formData, setFormData] = useState({});
  const [isModified, setIsModified] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get(`/bank/${id}`);
      setBank(response.data.data);
      setFormData(response.data.data);
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setIsModified(true);
  };

  const handleSubmit = async () => {
    try {
      const response = await axiosInstance.patch(`/bank/${id}`, formData);
      if (response.data.success) {
        setIsModified(false);
        fetchData();
        toast({
          title: 'Bank Details Updated successfully',
          className: 'bg-supperagent border-none text-white',
        });
      } else {
        toast({
          title: 'Error updating bank',
          className: 'bg-destructive border-none text-white',
        });
      }
    } catch (error) {
      toast({
        title: 'Error updating bank',
        className: 'bg-destructive border-none text-white',
      });
    }
  };

  if (!bank) {
    return (
      <div className="flex justify-center py-6">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="flex flex-row items-start justify-end">
          <Button
            className="bg-supperagent text-white hover:bg-supperagent/90"
            size={'sm'}
            onClick={() => navigate('/admin/bank-list')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back To Bank List
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {/* Name */}
            <InputField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />

            {/* Account No */}
            <InputField
              label="Account Number"
              name="accountNo"
              value={formData.accountNo}
              onChange={handleInputChange}
            />

            {/* Sort Code */}
            <InputField
              label="Sort Code"
              name="sortCode"
              value={formData.sortCode}
              onChange={handleInputChange}
            />

            {/* Beneficiary */}
            <InputField
              label="Beneficiary"
              name="beneficiary"
              value={formData.beneficiary}
              onChange={handleInputChange}
            />
          </div>

          {isModified && (
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                className="bg-supperagent text-white hover:bg-supperagent/90"
                onClick={handleSubmit}
              >
                Update Bank
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, type = 'text' }) => (
  <div className="flex flex-col p-2 rounded-lg">
    <span className="text-lg font-semibold text-gray-700">{label}</span>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      className="text-gray-800 p-2 rounded border border-gray-300"
    />
  </div>
);

export default BankDetailsPage;
