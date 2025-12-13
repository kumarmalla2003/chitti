
import { useState } from "react";
import PropTypes from "prop-types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/api";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import Message from "../../../../components/ui/Message";
import Skeleton from "../../../../components/ui/Skeleton";
import AuctionEntryForm from "../forms/AuctionEntryForm";
import Table from "../../../../components/ui/Table";
import {
  Gavel,
  IndianRupee,
  User,
  Calendar,
  AlertCircle,
  Edit2
} from "lucide-react";

const AuctionsSection = ({ chitId, mode }) => {
  const [editingPayoutId, setEditingPayoutId] = useState(null);

  // 1. Fetch Payouts (Schedule)
  const { 
    data: payoutsData, 
    isLoading: isPayoutsLoading, 
    error: payoutsError 
  } = useQuery({
    queryKey: ["payouts", chitId],
    queryFn: () => api.get(`/payouts/chit/${chitId}`),
    enabled: !!chitId,
  });

  // 2. Fetch Members (for winner selection)
  const {
     data: membersData,
     isLoading: isMembersLoading
  } = useQuery({
     queryKey: ["members", chitId], // Fetch all members or members of chit?
     // Ideally only members assigned to this chit.
     queryFn: () => api.get(`/assignments/chit/${chitId}`), // Use assignments to get members
     enabled: !!chitId,
  });
  
  // Extract members from assignments
  const members = membersData?.data?.assignments?.map(a => a.member) || [];

  const payouts = payoutsData?.data?.payouts || [];

  if (isPayoutsLoading || isMembersLoading) {
     return <div className="space-y-4">
         <Skeleton.PageHeader />
         <Skeleton.Table />
     </div>;
  }

  if (payoutsError) {
      return <Message type="error">Failed to load auction schedule.</Message>;
  }

  // --- Render Helpers ---

  const handleEdit = (payoutId) => {
    setEditingPayoutId(payoutId);
  };

  const handleCancelEdit = () => {
    setEditingPayoutId(null);
  };

  const handleSuccess = () => {
    setEditingPayoutId(null);
  };

  const renderMobileCard = (payout) => {
     const isEditing = editingPayoutId === payout.id;
     const isCompleted = payout.bid_amount !== null && payout.bid_amount !== undefined;

     if (isEditing) {
         return (
             <Card key={payout.id} className="mb-4 border-l-4 border-l-accent">
                 <AuctionEntryForm 
                    chitId={chitId} 
                    payout={payout} 
                    members={members}
                    onCancel={handleCancelEdit}
                    onSuccess={handleSuccess}
                 />
             </Card>
         );
     }

     return (
        <Card key={payout.id} className="mb-4">
           <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2">
                   <div className="bg-background-tertiary p-2 rounded-full">
                       <span className="font-bold text-text-primary text-sm flex items-center justify-center w-5 h-5">
                          {payout.month}
                       </span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-sm font-medium text-text-secondary">Month</span>
                   </div>
               </div>
               
               {isCompleted ? (
                   <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                       Auctioned
                   </span>
               ) : (
                   <span className="text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                       Pending
                   </span>
               )}
           </div>
           
           <div className="space-y-2 mt-3">
               <div className="flex justify-between text-sm">
                   <span className="text-text-secondary flex items-center gap-1">
                       <IndianRupee className="w-3 h-3" /> Bid Amount
                   </span>
                   <span className="font-semibold text-text-primary">
                       {isCompleted ? `₹${payout.bid_amount?.toLocaleString("en-IN")}` : "-"}
                   </span>
               </div>
               <div className="flex justify-between text-sm">
                   <span className="text-text-secondary flex items-center gap-1">
                       <User className="w-3 h-3" /> Winner
                   </span>
                   <span className="font-semibold text-text-primary truncate max-w-[150px]">
                       {isCompleted && payout.member ? payout.member.name : "-"}
                   </span>
               </div>
           </div>

           {mode !== "view" && (
             <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <Button 
                    variant={isCompleted ? "outline" : "primary"} 
                    size="sm"
                    onClick={() => handleEdit(payout.id)}
                >
                    {isCompleted ? (
                        <>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit Result
                        </>
                    ) : (
                        <>
                           <Gavel className="w-4 h-4 mr-2" /> Enter Bid
                        </>
                    )}
                </Button>
             </div>
           )}
        </Card>
     );
  };

  // --- Render ---

  return (
    <div className="space-y-6">
        {/* Header Summary */}
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Gavel className="w-6 h-6 text-accent" />
              Auctions
           </h2>
           {/* Add summary stats here if needed, e.g. "3/20 Completed" */}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
            {payouts.map(renderMobileCard)}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
             <Table
                data={payouts}
                columns={[
                    {
                        header: "Month",
                        accessor: "month",
                        cell: (row) => (
                            <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center text-sm font-bold">
                                {row.month}
                            </div>
                        ),
                    },
                    {
                        header: "Status",
                        accessor: "status",
                        cell: (row) => {
                            const isCompleted = row.bid_amount !== null && row.bid_amount !== undefined;
                            return isCompleted ? (
                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Auctioned
                                </div>
                            ) : (
                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                </div>
                            );
                        },
                    },
                    {
                        header: "Bid Amount",
                        accessor: "bid_amount",
                        cell: (row) => {
                             const isCompleted = row.bid_amount !== null && row.bid_amount !== undefined;
                             return isCompleted ? `₹${row.bid_amount?.toLocaleString("en-IN")}` : "-";
                        }
                    },
                    {
                        header: "Winner",
                        accessor: "member",
                        cell: (row) => {
                             const isCompleted = row.bid_amount !== null && row.bid_amount !== undefined;
                             return isCompleted && row.member ? (
                                <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs">
                                         {row.member.name.charAt(0)}
                                     </div>
                                     {row.member.name}
                                </div>
                             ) : "-";
                        }
                    },
                    {
                        header: "Actions",
                        className: "text-right",
                        cell: (row) => {
                             const isCompleted = row.bid_amount !== null && row.bid_amount !== undefined;
                             const isEditing = editingPayoutId === row.id;
                             
                             if (isEditing) {
                                  // Render form in place? Table component doesn't easily support expanding rows or replacing row content.
                                  // For simplicity in this layout, we might need a modal or separate edit handling if we can't inject the form into the row easily.
                                  // BUT, since we are using data driven table, injecting a Form into a <td> might be cramped.
                                  // Alternative: Popover or Modal.
                                  // Given the limitations of the data-driven table, let's use a conditional render OUTSIDE the table for editing, 
                                  // OR just render the button that toggles the mobile-card-like edit view?
                                  // Actually, the previous code tried to render the form INSIDE a TR. which is hard with this Table component.
                                  // Let's use a Portal/Dialog for editing or just switch the view mode?
                                  // Simplest: When editing, show the Form in a Modal or Overlay. 
                                  // OR: Filter the table to show only the editing row? No that's bad UX.
                                  
                                  // Let's revert to: Click edit -> Opens a Dialog/Modal with AuctionEntryForm.
                                  // But I don't have a Dialog component ready (or do I?).
                                  // Let's check imports. No Dialog.
                                  
                                  // Hack: Render the edit form in a separate "Editing Mode" replacement for the table?
                                  // No, that hides context.
                                  
                                  // Let's just use the Button action to set editingPayoutId, and render a fixed overlay or simple absolute pos form?
                                  // Actually, for now, let's just keep the button. The previous implementation had a "Edit Result" button.
                                  
                                  return (
                                     <Button 
                                         variant="ghost" 
                                         size="sm"
                                         onClick={() => handleEdit(row.id)}
                                         className="text-accent hover:text-accent-hover"
                                     >
                                        Edit
                                     </Button>
                                  );
                             }

                             if (mode === "view") return null;

                             return (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEdit(row.id)}
                                    className="text-accent hover:text-accent-hover"
                                >
                                    {isCompleted ? "Edit" : "Enter Bid"}
                                </Button>
                             );
                        }
                    }
                ]}
             />
             
             {/* Simple Edit Modal/Overlay for Desktop if editing */}
             {editingPayoutId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                     <div className="bg-background-secondary rounded-lg shadow-lg max-w-md w-full p-6">
                        <AuctionEntryForm 
                             chitId={chitId} 
                             payout={payouts.find(p => p.id === editingPayoutId)} 
                             members={members}
                             onCancel={handleCancelEdit}
                             onSuccess={handleSuccess}
                        />
                     </div>
                </div>
             )}
        </div>
    </div>
  );
};

AuctionsSection.propTypes = {
  chitId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  mode: PropTypes.string.isRequired,
};

export default AuctionsSection;
