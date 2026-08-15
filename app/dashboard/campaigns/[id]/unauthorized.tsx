export default function Unauthorized() {
  return (
    <div className="h-screen flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-2xl font-bold text-red-600">
          Access Denied
        </h1>
        <p className="text-muted-foreground mt-2">
          Only brand accounts can access this section.
        </p>
      </div>
    </div>
  );
}