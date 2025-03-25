import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, User, CreditCard, Camera, ArrowLeft } from 'lucide-react'; // Importing Lucid icons
import { EnvelopeOpenIcon } from '@radix-ui/react-icons';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '../components/image-uploader';
import { toast } from '@/components/ui/use-toast';

const RemitDetailsPage = () => {
  const { id } = useParams(); // Get the remit ID from the URL
  const [remit, setRemit] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [formData, setFormData] = useState({}); // Store the form data
  const [isModified, setIsModified] = useState(false); // Track if any field is modified
  const navigate = useNavigate();

  // Fetch remit data
  const fetchData = async () => {
    try {
      const response = await axiosInstance.get(`/remit/${id}`);
      setRemit(response.data.data); // Assuming the response contains the data in `data`
      setFormData(response.data.data); // Initialize form data with fetched remit data
    } catch (error) {
      console.error('Error fetching remit details:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setIsModified(true); // Set modified state to true
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const response = await axiosInstance.patch(`/remit/${id}`, formData);
      if (response.data.success) {
        setIsModified(false); // Reset modified state after successful update
        fetchData(); // Refresh data after submit
        
        toast({ title: "Record Updated successfully", className: "bg-supperagent border-none text-white", });
      } else {
        toast({ title: "Error updating remit ", className: "bg-destructive border-none text-white", });

      }
    } catch (error) {
      toast({ title: "Error updating remit ", className: "bg-destructive border-none text-white", });
    }
  };

  const handleUploadComplete = (data) => {
    setUploadOpen(false);
    fetchData();
  };

  if (!remit) {
    return (
      <div className="flex justify-center py-6">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="flex flex-row items-start justify-between">
          <div className="pb-4">
            <div className="relative h-48 w-48 overflow-hidden">
              <img
                src={
                  remit?.logo ||
                  'https://kzmjkvje8tr2ra724fhh.lite.vusercontent.net/placeholder.svg'
                }
                alt={`remit Logo`}
                className="h-full w-full object-cover"
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-7 rounded-full"
                onClick={() => setUploadOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 ">
              Image size should be passport-sized (600px X 600px).
            </p>
          </div>
          <div>
            <Button
              className="bg-supperagent text-white hover:bg-supperagent/90"
              size={'sm'}
              onClick={() => navigate('/admin/invoice/remit')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back To Remit List
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {/* Name */}
            <div className="flex flex-col   p-2 rounded-lg   transition">
              <div className="flex items-center   ">
                <span className="text-lg font-semibold text-gray-700">Name</span>
              </div>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="text-gray-800 p-2 rounded border border-gray-300"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col   p-2 rounded-lg  ">
              <div className="flex items-center   ">
                <span className="text-lg font-semibold text-gray-700">Email</span>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="text-gray-800 p-2 rounded border border-gray-300"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col   p-2 rounded-lg  ">
              <div className="flex items-center   ">
                <span className="text-lg font-semibold text-gray-700">Address</span>
              </div>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className="text-gray-800 p-2 rounded border border-gray-300"
              />
            </div>

            {/* Sort Code */}
            <div className="flex flex-col   p-2 rounded-lg  ">
              <div className="flex items-center   ">
                <span className="text-lg font-semibold text-gray-700">Sort Code</span>
              </div>
              <input
                type="text"
                name="sortCode"
                value={formData.sortCode || ''}
                onChange={handleInputChange}
                className="text-gray-800 p-2 rounded border border-gray-300"
              />
            </div>

            {/* Account No */}
            <div className="flex flex-col   p-2 rounded-lg  ">
              <div className="flex items-center   ">
                <span className="text-lg font-semibold text-gray-700">Account No</span>
              </div>
              <input
                type="text"
                name="accountNo"
                value={formData.accountNo || ''}
                onChange={handleInputChange}
                className="text-gray-800 p-2 rounded border border-gray-300"
              />
            </div>

            {/* Beneficiary */}
            <div className="flex flex-col   p-2 rounded-lg  ">
              <div className="flex items-center   ">
                <span className="text-lg font-semibold text-gray-700">Beneficiary</span>
              </div>
              <input
                type="text"
                name="beneficiary"
                value={formData.beneficiary || ''}
                onChange={handleInputChange}
                className="text-gray-800 p-2 rounded border border-gray-300"
              />
            </div>
          </div>

          {/* Show Update Remit button only if fields are modified */}
          {isModified && (
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                className="bg-supperagent text-white hover:bg-supperagent/90"
                onClick={handleSubmit}
              >
                Update Remit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image Uploader */}
      <ImageUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
        remitId={remit?._id}
      />
    </div>
  );
};

export default RemitDetailsPage;