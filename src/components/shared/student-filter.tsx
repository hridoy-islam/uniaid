import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "../ui/button"
import { Printer, Search } from "lucide-react"
import { useEffect, useState } from "react";
import axiosInstance from '../../lib/axios'


export default function StudentFilter({ onSubmit }){
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<any>(null);
    const [institues, setInstitutes] = useState<any>([]);
    const [terms, setTerms] = useState<any>([]);
    const [academicYear, setAcademicYear] = useState<any>([]);
    const [agents, setAgents] = useState<any>([]);
    const [staffs, setStaffs] = useState<any>([]);

    const fetchData = async () => {
      try {
        const [institueResponse, termsResponse, academicYearResponse, agentResponse, staffResponse] = await Promise.all([
          axiosInstance.get('/institutions?limit=all&status=1'),  // Adjust the endpoint as needed
          axiosInstance.get('/terms?limit=all&status=1'),
          axiosInstance.get('/academic-years?limit=all&status=1'),
          axiosInstance.get('/agents?where=with:user,status,1'),
          axiosInstance.get('/staffs?where=with:user,status,1'),
        ]);
        setInstitutes(institueResponse.data.data.result);
        setTerms(termsResponse.data.data.result);
        setAcademicYear(academicYearResponse.data.data.result);
        setAgents(agentResponse.data.data.result);
        setStaffs(staffResponse.data.data.result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    useEffect(() => {  
      fetchData();
    }, []);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ searchTerm, status });
    };

    return(
        
        <div >
          <form onSubmit={handleSubmit} className="mb-3 grid gap-4 md:grid-cols-2 lg:grid-cols-4 shadow-2xl p-4 rounded-md">
          <div>
            <label className="mb-2 block text-sm font-medium">Search</label>
            <Input placeholder="Ref No, Name, Email, Phone" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">DOB</label>
            <Input placeholder="DOB" type="date" /> 
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium">Academic Year</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Academic Year" />
              </SelectTrigger>
              <SelectContent>
              {academicYear.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.academic_year}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Select Terms</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Academic Year" />
              </SelectTrigger>
              <SelectContent>
              {terms.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.term}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Institue</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Institue" />
              </SelectTrigger>
              <SelectContent>
              {institues.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Select onValueChange={(value) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Agent</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
              {agents.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.agentName}
                </SelectItem>
              ))}
               
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Staffs</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Staff" />
              </SelectTrigger>
              <SelectContent>
              {staffs.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>
          <div></div>
          <div></div>
          <div></div>

          <div className="flex gap-4 justify-end">
            <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent/90"> <Search className="h-4 w-4 mr-3" /> Search</Button>
            <Button className="bg-secondary text-white hover:bg-secondary/90"> <Printer className="h-4 w-4 mr-3" /> Export</Button>
          
          </div>
          </form>

        </div>
    )
}