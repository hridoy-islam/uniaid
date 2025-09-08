import { GraduationCap, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserNav } from './user-nav';

export function TopNav() {
  return (
    <div className="flex h-16 items-center justify-between bg-supperagent px-4">
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-2 text-white">
           <img
                src="/logo.png"
                alt="Desk illustration"
                width={25}
                height={20}
              />
            <span className="text-lg font-semibold">i Apply Portal</span>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        {/* <div className="relative">
          <Input
            placeholder="Search..."
            className="w-64 border-white bg-white/10 text-white placeholder:text-white/60"
          />
        </div>
        <Button variant="ghost" size="icon" className="text-white">
          <BellIcon className="h-5 w-5" />
        </Button> */}

        <UserNav />
      </div>
    </div>
  );
}
