import ErrorMessage from '@/components/shared/error-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { countries, languages, mockData } from '@/types';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { Divide } from 'lucide-react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

export function PersonalDetailsForm({ student, onSave }) {
  const { user } = useSelector((state: any) => state.auth);
  const {
    handleSubmit,
    register,
    control,
    reset,
    setValue, // Needed to set the selected agent
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      firstName: '',
      lastName: '',
      phone: '',
      dob: '',
      email: '',
      gender: '',
      maritualStatus: '',
      nationality: '',
      countryResidence: '',
      countryBirth: '',
      nativeLanguage: '',
      passportName: '',
      passportIssueLocation: '',
      passportNumber: '',
      passportIssueDate: '',
      passportExpiryDate: '',
      collegeRoll: '',
      agent: '',
      addressLine1: '',
      addressLine2: '',
      townCity: '',
      state: '',
      postCode: '',
      country: '',
      disabilities: '',
      ethnicity: '',
      genderIdentity: '',
      sexualOrientation: '',
      religion: ''
    }
  });
  const [staffOptions, setStaffOptions] = useState<any>([]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      if (isLoading) setIsLoading(true);
      const response = await axiosInstance.get('/users?role=agent&limit=10000');
      const options = response.data.data.result.map((agent) => ({
        value: agent._id,
        label: agent.name
      }));
      setStaffOptions(options);
      setIsLoading(false); // Set loading to false after fetching
    } catch (error) {
      console.error('Error fetching agents:', error);
      setIsLoading(false); // Set loading to false even if there's an error
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (student) {
      reset({
        title: student.title || '',
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        dob: student.dob || '',
        phone: student.phone || '',
        email: student.email || '',
        gender: student.gender || '',
        maritualStatus: student.maritualStatus || '',
        nationality: student.nationality || '',
        countryResidence: student.countryResidence || '',
        countryBirth: student.countryBirth || '',
        nativeLanguage: student.nativeLanguage || '',
        passportName: student.passportName || '',
        passportIssueLocation: student.passportIssueLocation || '',
        passportNumber: student.passportNumber || '',
        passportIssueDate: student.passportIssueDate || '',
        passportExpiryDate: student.passportExpiryDate || '',
        collegeRoll: student.collegeRoll || '',
        agent: student.agent?.value || '',
        addressLine1: student.addressLine1 || '',
        addressLine2: student.addressLine2 || '',
        townCity: student.townCity || '',
        state: student.state || '',
        postCode: student.postCode || '',
        country: student.country || '',
        disabilities: student.disabilities || '',
        ethnicity: student.ethnicity || '',
        genderIdentity: student.genderIdentity || '',
        sexualOrientation: student.sexualOrientation || '',
        religion: student.religion || ''
      });
    }
  }, [student, reset]);

  // Ensure agentId is set again when staffOptions are updated
  useEffect(() => {
    if (student?.agent?._id) {
      setValue('agent', student.agent._id);
    }
  }, [staffOptions, student, setValue]);

  // Fetch agents when the component mounts

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-2 space-y-4 rounded-md p-4 shadow-md"
      >
        <div className="grid grid-cols-3 gap-4">
          {/* Title Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.titles.map((title, index) => (
                      <SelectItem key={index} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              {...register('firstName', { required: 'First Name is required' })}
            />
            <ErrorMessage message={errors.firstName?.message?.toString()} />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              {...register('lastName', { required: 'Last Name is required' })}
            />
            <ErrorMessage message={errors.lastName?.message?.toString()} />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone', {
                onChange: (e) => {
                   const cleanedValue = e.target.value.replace(/\s+/g, '');
                  setValue('phone', cleanedValue);
                }
              })}
            />
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-2 space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="dob"
                  selected={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date)}
                  dateFormat="dd-MM-yyyy"
                  className="input-class w-full rounded-md border border-gray-300 bg-transparent  px-4 py-1.5" // your custom styling
                  placeholderText="DD-MM-YYYY"
                  showYearDropdown
                  showMonthDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                />
              )}
            />
          </div>

          {/* Marital Status Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="maritualStatus">Marital Status *</Label>
            <Controller
              name="maritualStatus"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.maritalStatuses.map((status, index) => (
                      <SelectItem key={index} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Gender Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.gender.map((gender, index) => (
                      <SelectItem key={index} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality *</Label>

            <Controller
              name="nationality"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.nationality || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country, index) => (
                      <SelectItem key={index} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <ErrorMessage message={errors.nationality?.message?.toString()} />
          </div>

          {/* Country of Residence */}
          <div className="space-y-2">
            <Label htmlFor="countryResidence">Country of Residence *</Label>
            <Controller
              name="countryResidence"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.countryResidence || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country, index) => (
                      <SelectItem key={index} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Country of Birth */}
          <div className="space-y-2">
            <Label htmlFor="countryBirth">Country of Birth *</Label>
            <Controller
              name="countryBirth"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.countryBirth || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country, index) => (
                      <SelectItem key={index} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Native Language */}
          <div className="space-y-2">
            <Label htmlFor="nativeLanguage">Native Language *</Label>
            <Controller
              name="nativeLanguage"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.nativeLanguage || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((item, index) => (
                      <SelectItem key={index} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Passport Name */}
          <div className="space-y-2">
            <Label htmlFor="passportName">
              Name as it appears in Passport:
            </Label>
            <Input
              id="passportName"
              type="text"
              {...register('passportName')}
            />
          </div>

          {/* Passport Issue Location */}
          <div className="space-y-2">
            <Label htmlFor="passportIssueLocation">
              Passport Issue Location:
            </Label>
            <Input
              id="passportIssueLocation"
              {...register('passportIssueLocation')}
            />
          </div>

          {/* Passport Number */}
          <div className="space-y-2">
            <Label htmlFor="passportNumber">Passport Number</Label>
            <Input
              id="passportNumber"
              type="text"
              {...register('passportNumber')}
            />
          </div>

          {/* Passport Issue Date */}
          <div className="space-y-2">
            <Label htmlFor="passportIssueDate">Passport Issue Date</Label>
            <Input
              id="passportIssueDate"
              type="date"
              {...register('passportIssueDate')}
            />
          </div>

          {/* Passport Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="passportExpiryDate">Passport Expiry Date</Label>
            <Input
              id="passportExpiryDate"
              type="date"
              {...register('passportExpiryDate')}
            />
          </div>

          {/* Collage Roll */}
          <div className="space-y-2">
            <Label htmlFor="collegeRoll">College Roll</Label>
            <Input id="collegeRoll" {...register('collegeRoll')} />
          </div>

          {(user.role === 'admin' ||
            (user.role === 'staff' &&
              user.privileges?.student?.agentChange)) && (
            <div>
              <Label htmlFor="agent">Agent</Label>
              <Controller
                name="agent"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value || ''}
                    className="w-full rounded border p-2"
                  >
                    <option value="">Select an Agent</option>
                    {staffOptions.map((agent) => (
                      <option key={agent.value} value={agent.value}>
                        {agent.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1*</Label>
            <Input
              id="addressLine1"
              {...register('addressLine1', {
                required: 'Address Line 1 is required'
              })}
            />
            <ErrorMessage message={errors.addressLine1?.message?.toString()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input id="addressLine2" {...register('addressLine2')} />
            <ErrorMessage message={errors.addressLine2?.message?.toString()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="townCity">Town / City</Label>
            <Input
              id="townCity"
              {...register('townCity', { required: 'Town / City is required' })}
            />
            <ErrorMessage message={errors.townCity?.message?.toString()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register('state')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postCode">Post Code</Label>
            <Input
              id="postCode"
              {...register('postCode', { required: 'Post Code is required' })}
            />
            <ErrorMessage message={errors.postCode?.message?.toString()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('country', { required: 'Country is required' })}
            />
            <ErrorMessage message={errors.country?.message?.toString()} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 space-y-2">
          <div>
            <Label htmlFor="disabilities">
              Do you have any disabilities that require arrangements from the
              college or special needs that applies to you? *
            </Label>
            <Controller
              name="disabilities"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.disabilities || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="ethnicity">Ethnicity *</Label>
            <Controller
              name="ethnicity"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.ethnicity || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.ethnicities.map((title, index) => (
                      <SelectItem key={index} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="genderIdentity">
              Please indicate if your Gender identity is the same as the gender
              originally assigned to you at birth *
            </Label>
            <Controller
              name="genderIdentity"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.genderIdentity || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="prefer-not-to-say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="sexualOrientation">Sexual Orientation *</Label>
            <Controller
              name="sexualOrientation"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.sexualOrientation || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.sexualOrientation.map((title, index) => (
                      <SelectItem key={index} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="religion">Religion or Belief *</Label>
            <Controller
              name="religion"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || student?.religion || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockData.religion.map((title, index) => (
                      <SelectItem key={index} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant={'outline'}
            className="border-none bg-supperagent text-white hover:bg-supperagent/90"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
