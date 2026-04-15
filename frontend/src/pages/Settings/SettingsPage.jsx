import { PageSection } from "../../components/common/PageSection";
import { useToast } from "../../store/toast/toast.store";

export function SettingsPage() {
  const toast = useToast();

  return (
    <PageSection title="Cài đặt" subtitle="Cấu hình hệ thống và tài khoản">
      <p>Từ đây bạn có thể mở rộng dark mode, hồ sơ và thông báo ngân sách.</p>
      <button type="button" className="secondary-button" onClick={() => toast.success("Cài đặt đã sẵn sàng.")}>Kiểm tra nhanh</button>
    </PageSection>
  );
}
