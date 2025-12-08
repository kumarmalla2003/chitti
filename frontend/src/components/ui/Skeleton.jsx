// frontend/src/components/ui/Skeleton.jsx
const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-background-tertiary ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
