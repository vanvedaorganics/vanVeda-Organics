import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export default function Modal({ open, onOpenChange, title, children, className = "" }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className={`fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-md p-6 ${className}`}
          style={{ maxHeight: "90vh", overflowY: "auto" }} // <-- Add this line
        >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold text-[#084629]">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}