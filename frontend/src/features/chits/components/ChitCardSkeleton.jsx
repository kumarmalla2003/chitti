// frontend/src/features/chits/components/ChitCardSkeleton.jsx
import Skeleton from "../../../components/ui/Skeleton";

const ChitCardSkeleton = () => {
  return (
    <div className="rounded-lg p-4 shadow-md bg-background-secondary h-40 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
      </div>

      <hr className="border-border mb-3" />

      <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
};

export default ChitCardSkeleton;
