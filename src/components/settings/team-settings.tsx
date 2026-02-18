"use client";

import { useState, useEffect } from "react";
import { Profile, USER_ROLE_LABELS } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getTeamMembers,
  getPendingInvitations,
  inviteMember,
  cancelInvitation,
  removeMember,
} from "@/lib/actions/team";
import { UserPlus, Trash2, X, Copy } from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string;
  role: "ADMIN" | "OPERATEUR";
  avatar_url: string | null;
  created_at: string;
  email: string | null;
}

interface Invitation {
  id: string;
  email: string;
  invited_name: string | null;
  role: "ADMIN" | "OPERATEUR";
  created_at: string;
  expires_at: string;
}

interface TeamSettingsProps {
  profile: Profile;
}

export default function TeamSettings({ profile }: TeamSettingsProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "OPERATEUR">("OPERATEUR");
  const [inviting, setInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  async function loadData() {
    setLoading(true);
    const [membersResult, invitationsResult] = await Promise.all([
      getTeamMembers(),
      getPendingInvitations(),
    ]);

    if (membersResult.members) {
      setMembers(membersResult.members);
    }

    if (invitationsResult.invitations) {
      setInvitations(invitationsResult.invitations);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);

    const result = await inviteMember({
      email: inviteEmail,
      role: inviteRole,
      name: inviteName || undefined
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Invitation envoyée");
      setInviteEmail("");
      setInviteName("");
      setInviteRole("OPERATEUR");
      setInviteDialogOpen(false);
      loadData();
    }

    setInviting(false);
  }

  async function handleCancelInvitation(invitationId: string) {
    const result = await cancelInvitation(invitationId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Invitation annulée");
      loadData();
    }
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return;

    const result = await removeMember(memberToRemove.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${memberToRemove.full_name} a été retiré de l'équipe`);
      setMemberToRemove(null);
      loadData();
    }
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Membres de l'équipe</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} membre{members.length > 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau membre</DialogTitle>
              <DialogDescription>
                Envoyez une invitation par email pour rejoindre l'équipe
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom et prénom (optionnel)</Label>
                <Input
                  id="name"
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Jean Dupont"
                />
                <p className="text-xs text-muted-foreground">
                  Personnalise l'email d'invitation
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="nom@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value: "ADMIN" | "OPERATEUR") =>
                    setInviteRole(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATEUR">Opérateur</SelectItem>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Les administrateurs peuvent gérer l'équipe et les paramètres
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={inviting}>
                {inviting ? "Envoi..." : "Envoyer l'invitation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members list */}
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-4 border rounded-lg"
          >
            <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-primary">
                  {getInitials(member.full_name)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{member.full_name}</p>
                {member.id !== profile.id && member.email && (
                  <span className="text-sm text-muted-foreground truncate">{member.email}</span>
                )}
                {member.id === profile.id && (
                  <Badge variant="secondary" className="flex-shrink-0">Vous</Badge>
                )}
              </div>
              <Badge
                variant={member.role === "ADMIN" ? "default" : "secondary"}
                className="mt-1 flex-shrink-0"
              >
                {USER_ROLE_LABELS[member.role]}
              </Badge>
            </div>
            {member.id !== profile.id && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMemberToRemove(member)}
                className="text-destructive hover:text-destructive flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Invitations en attente</h3>
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-4 border border-dashed rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {invitation.invited_name || invitation.email}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {invitation.invited_name && <>{invitation.email}<br /></>}
                    Invité le {new Date(invitation.created_at).toLocaleDateString("fr-FR")} • Expire le {new Date(invitation.expires_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCancelInvitation(invitation.id)}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2">
                <Badge variant="secondary">
                  {USER_ROLE_LABELS[invitation.role]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Remove member confirmation dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.full_name} perdra l'accès à l'organisation. Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
