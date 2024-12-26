import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Switch } from "@/components/ui/switch"

export function CourseDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  initialData 
}) {
  const [name, setName] = useState(initialData?.name ?? "")
  // const [active, setActive] = useState(initialData?.active ?? true)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ name })
    onOpenChange(false)
    setName("")
    // setActive(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Course Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {/* <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
            />
          </div> */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-supperagent text-white hover:bg-supperagent/90 border-none">Submit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
