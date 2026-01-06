import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import axiosInstance from '../../lib/axios';

import { useToast } from '@/components/ui/use-toast';
import { Camera } from 'lucide-react';
import { ImageUploader } from './components/userImage-uploader';
import { countries } from '@/types';

const profileFormSchema = z.object({
  name: z.string().nonempty('Name is required'),
  email: z.string().email({ message: 'Enter a valid email address' }),
  location: z.string().nonempty('Address Line 1 is required'),
  phone: z.string().optional(),
  location2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postCode: z.string().optional(),
  vatNo: z.string().optional(),
  country: z.string().nonempty('Country is required'),
  sortCode: z.string().nonempty('Sort Code is required'),
  accountNo: z.string().nonempty('Account Number is required'),
  beneficiary: z.string().nonempty('Beneficiary is required')
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { user } = useSelector((state: any) => state.auth);
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(
    null
  );
  const { toast } = useToast();

  const defaultValues: Partial<ProfileFormValues> = {
    name: profileData?.name || '',
    email: profileData?.email || '',
    location: profileData?.location || '',
    phone: profileData?.phone || '',
    location2: profileData?.location2 || '',
    city: profileData?.city || '',
    state: profileData?.state || '',
    postCode: profileData?.postCode || '',
    country: profileData?.country || '',
    sortCode: profileData?.sortCode || '',
    accountNo: profileData?.accountNo || '',
    beneficiary: profileData?.beneficiary || '',
    vatNo: profileData?.vatNo || ''
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  const fetchProfileData = async () => {
    try {
      const response = await axiosInstance.get(`/users/${user?._id}`);
      const data = response.data.data;
      setProfileData(data);
      form.reset(data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: 'Error',
        description: 'Unable to fetch profile data',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await axiosInstance.patch(`/users/${user?._id}`, data);
      toast({
        title: 'Profile Updated',
        className: 'bg-supperagent border-none text-white'
      });
    } catch (error) {
      toast({
        title: 'Operation Failed',
        className: 'bg-destructive border-none text-white'
      });
    }
  };

  const handleUploadComplete = (data) => {
    setUploadOpen(false);
    fetchProfileData();
  };

  return (
    <div className="space-y-2 p-2 md:p-2">
      <div className="relative h-48 w-48 overflow-hidden rounded-full">
        <img
          src={
            profileData?.imgUrl ||
            'https://kzmjkvje8tr2ra724fhh.lite.vusercontent.net/placeholder.svg'
          }
          alt={`${user?.name}`}
          className="h-full w-full object-contain"
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-7 rounded-full"
          onClick={() => setUploadOpen(true)}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Your Name..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@example.com"
                        disabled
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1 *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Your Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Address Line 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Post Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Controller
                        name="country"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Sort Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Account Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="beneficiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Beneficiary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT reg no</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter VAT Reg Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              className="mt-3 bg-supperagent text-white hover:bg-supperagent"
              type="submit"
            >
              Update profile
            </Button>
          </div>
        </form>
      </Form>

      <ImageUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
        entityId={user?._id}
      />
    </div>
  );
}
