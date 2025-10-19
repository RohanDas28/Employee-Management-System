import { toast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning";

export const showToast = (
  type: ToastType,
  message: string,
  playSound = false
) => {
  if (playSound) {
    const audio = new Audio("/pop.mp3");
    audio.play();
  }

  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "info":
      toast.info(message);
      break;
    case "warning":
      toast.warning(message);
      break;
    default:
      toast(message);
      break;
  }
};
