'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (user?.role === 'tenant') {
        router.push('/tenant');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <h1 className="text-2xl font-bold text-primary-600">نظام إدارة العقارات</h1>
          </div>

          <div className="flex items-center space-x-4">
            {!isAuthenticated && !isLoading && (
              <Link href="/login">
                <Button variant="primary" className="px-6">تسجيل الدخول</Button>
              </Link>
            )}

            {isAuthenticated && !isLoading && (
              <Link href={user?.role === 'tenant' ? '/tenant' : '/dashboard'}>
                <Button variant="primary">لوحة التحكم</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  إدارة العقارات المبسطة
                </h2>
                <div className="h-1 w-20 bg-white mt-6"></div>
              </div>

              <p className="text-xl">
                حل متكامل لملاك العقارات والمستأجرين لإدارة
                العقارات، والمستأجرين ، وطلبات الخدمة.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {!isAuthenticated && !isLoading ? (
                  <Link href="/login">
                    <Button size="lg" className="bg-white text-primary-600 border-white hover:bg-gray-100 px-8 py-3">
                      ابدأ الآن
                    </Button>
                  </Link>
                ) : (
                  <Link href={user?.role === 'tenant' ? '/tenant' : '/dashboard'}>
                    <Button size="lg" className="bg-white text-primary-600 border-white hover:bg-gray-100 px-8 py-3">
                      الذهاب إلى لوحة التحكم
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="hidden md:block">
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <div className="p-5 bg-gray-50">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>

                  <div className="rounded-lg overflow-hidden shadow-inner bg-white p-4">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="ml-3 font-semibold text-gray-800">لوحة إدارة العقارات</h3>
                      </div>
                      <div className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-full">
                        3 طلبات جديدة
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded border border-blue-100">
                          <div className="text-sm text-blue-700 font-medium">إجمالي الوحدات</div>
                          <div className="text-2xl font-bold text-blue-900">91</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded border border-green-100">
                          <div className="text-sm text-green-700 font-medium">المؤجرة</div>
                          <div className="text-2xl font-bold text-green-900">80</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">النشاطات الأخيرة</span>
                          <span className="text-xs text-primary-600">عرض الكل</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-gray-700">تم استلام دفعة جديدة</span>
                            <span className="ml-auto text-gray-500 text-xs">2h ago</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-gray-700">طلب إيجار</span>
                            <span className="ml-auto text-gray-500 text-xs">5h ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">الميزات الرئيسية</h2>
            <div className="h-1 w-20 bg-primary-500 mx-auto"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-6">
              يقدم نظامنا مجموعة واسعة من الميزات لكل من ملاك العقارات والمستأجرين.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-primary-100 w-16 h-16 flex items-center justify-center text-primary-600 mb-6">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">إدارة العقارات</h3>
              <p className="text-gray-600 mb-4">
                إدارة المباني، والوحدات، والمستأجرين بسهولة في منصة مركزية واحدة مع تتبع وتقارير مفصلة.
              </p>

              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  إدارة محفظة المباني                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  تتبع مخزون الوحدات                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-primary-100 w-16 h-16 flex items-center justify-center text-primary-600 mb-6">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">نظام المستأجرين </h3>
              <p className="text-gray-600 mb-4">
                إنشاء وإدارة حجوزات العقارات مع تتبع مفصل، وتخزين العقود، ودمج المدفوعات.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  إدارة العقود                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  تتبع المدفوعات                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-primary-100 w-16 h-16 flex items-center justify-center text-primary-600 mb-6">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">طلبات الخدمة</h3>
              <p className="text-gray-600 mb-4">
                تقديم وتتبع طلبات الصيانة وأوامر الخدمة بكفاءة مع تحديثات في الوقت الفعلي.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  نظام تذاكر الصيانة                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  تتبع سجل الخدمة                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-xl text-gray-700">عقارات تمت إدارتها</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">2,000+</div>
              <div className="text-xl text-gray-700">مستأجر سعيد</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">98%</div>
              <div className="text-xl text-gray-700">رضا العملاء</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">هل أنت مستعد لتبسيط إدارة عقاراتك؟</h2>
          <p className="text-xl mb-8 text-primary-100">
            انضم إلى آلاف مديري العقارات والمستأجرين الذين يستخدمون منصتنا بالفعل.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3">
              ابدأ اليوم
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <h3 className="text-xl font-semibold">نظام إدارة العقارات</h3>
              </div>
              <p className="text-gray-400">
                تبسيط إدارة العقارات للمالكين والمستأجرين من خلال منصتنا الشاملة.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary-200">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                    تسجيل الدخول
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    من نحن                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    اتصل بنا
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary-200">اتصل بنا</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-primary-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>support@realestate-manager.com</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-primary-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+968 1234 5678</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-primary-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>123 شارع العقارات، مسقط، سلطنة عمان</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} نظام إدارة العقارات. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}