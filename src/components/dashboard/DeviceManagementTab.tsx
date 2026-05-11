import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Trash2, Edit2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { saveDevices } from "@/controllers/appController";
import { useDevices } from "@/ui/hooks/useAppState";

interface Device {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  addedDate: string;
}

const MAX_DEVICES = 2;

export const DeviceManagementTab = () => {
  const devices = useDevices() as Device[];
  const [newDeviceName, setNewDeviceName] = useState("");
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddDevice = () => {
    if (!newDeviceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a device name",
        variant: "destructive",
      });
      return;
    }

    if (devices.length >= MAX_DEVICES) {
      toast({
        title: "Device Limit Reached",
        description: `You can only connect ${MAX_DEVICES} devices. Please remove one first.`,
        variant: "destructive",
      });
      return;
    }

    const newDevice: Device = {
      id: Date.now().toString(),
      name: newDeviceName,
      status: "Active",
      addedDate: new Date().toLocaleDateString(),
    };

    saveDevices([...devices, newDevice]);
    setNewDeviceName("");
    setIsAddDialogOpen(false);
    
    toast({
      title: "Device Added",
      description: `${newDeviceName} has been connected successfully`,
    });
  };

  const handleRemoveDevice = (id: string) => {
    const device = devices.find(d => d.id === id);
    saveDevices(devices.filter((d) => d.id !== id));
    
    toast({
      title: "Device Removed",
      description: `${device?.name} has been disconnected`,
    });
  };

  const handleRenameDevice = () => {
    if (!editingDevice || !newDeviceName.trim()) return;

    const updatedDevices = devices.map((d) =>
      d.id === editingDevice.id ? { ...d, name: newDeviceName } : d
    );

    saveDevices(updatedDevices);
    setEditingDevice(null);
    setNewDeviceName("");
    setIsEditDialogOpen(false);
    
    toast({
      title: "Device Renamed",
      description: `Device renamed to ${newDeviceName}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Device Management</h2>
          <p className="text-muted-foreground mt-2">
            Manage your connected devices ({devices.length}/{MAX_DEVICES})
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={devices.length >= MAX_DEVICES}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold hover-scale glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-primary/20">
            <DialogHeader>
              <DialogTitle className="gradient-text">Add New Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  placeholder="e.g., iPhone 13, Samsung Galaxy"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="bg-background/50 border-primary/30 focus:border-primary"
                />
              </div>
              <Button
                onClick={handleAddDevice}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add Device
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {devices.length === 0 ? (
        <Card className="glass border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Smartphone className="w-16 h-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">No Devices Connected</h3>
              <p className="text-muted-foreground">
                Add your devices to start managing them
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devices.map((device) => (
            <Card key={device.id} className="glass border-primary/20 hover-scale transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{device.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Added: {device.addedDate}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={device.status === "Active" ? "default" : "secondary"}
                    className={device.status === "Active" ? "bg-primary" : ""}
                  >
                    {device.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen && editingDevice?.id === device.id} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 border-primary/30 hover:bg-primary/10"
                        onClick={() => {
                          setEditingDevice(device);
                          setNewDeviceName(device.name);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass border-primary/20">
                      <DialogHeader>
                        <DialogTitle className="gradient-text">Rename Device</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-device-name">New Device Name</Label>
                          <Input
                            id="edit-device-name"
                            placeholder="Enter new name"
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            className="bg-background/50 border-primary/30 focus:border-primary"
                          />
                        </div>
                        <Button
                          onClick={handleRenameDevice}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive"
                    onClick={() => handleRemoveDevice(device.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
