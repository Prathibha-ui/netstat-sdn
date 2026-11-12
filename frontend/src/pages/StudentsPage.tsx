import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StudentUser } from '../types';
import { Users, Plus, Edit2, Trash2, RefreshCw, Search, ShieldCheck } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);

  // Form fields
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('3rd Year (B.Tech)');
  const [room, setRoom] = useState('');
  const [password, setPassword] = useState('Student@123');

  const fetchStudents = async () => {
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openCreateModal = () => {
    setEditingStudent(null);
    setStudentId('');
    setName('');
    setEmail('');
    setDept('Computer Science & Engineering');
    setYear('3rd Year (B.Tech)');
    setRoom('Hostel 4, Room 204');
    setPassword('Student@123');
    setShowModal(true);
  };

  const openEditModal = (student: StudentUser) => {
    setEditingStudent(student);
    setStudentId(student.student_id);
    setName(student.name);
    setEmail(student.email);
    setDept(student.department);
    setYear(student.year);
    setRoom(student.hostel_room);
    setPassword('');
    setShowModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.student_id, {
          name,
          email,
          department: dept,
          year,
          hostel_room: room,
          ...(password ? { password } : {}),
        });
      } else {
        await api.createStudent({
          student_id: studentId,
          name,
          email,
          department: dept,
          year,
          hostel_room: room,
          password: password || 'Student@123',
        });
      }
      setShowModal(false);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to save student');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete student ${name} (${id})? This will also remove any registered devices and flow rules.`)) {
      return;
    }
    try {
      await api.deleteStudent(id);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.hostel_room.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Hostel Students Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            University directory of enrolled hostel students and active device registrations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStudents}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#1e3160] hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#0c152d] border border-slate-200 dark:border-[#1e3160] rounded-xl p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, Name, Room, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
          Total: {students.length} students
        </span>
      </div>

      {/* Students Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0c152d] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3160]">
              <tr>
                <th className="py-3 px-4 font-semibold">Student ID</th>
                <th className="py-3 px-4 font-semibold">Full Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Department & Year</th>
                <th className="py-3 px-4 font-semibold">Hostel Room</th>
                <th className="py-3 px-4 font-semibold">Device Registered?</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e3160]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/50 dark:hover:bg-[#14244a]/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-500 dark:text-sky-400">
                      {s.student_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {s.email}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div>{s.department}</div>
                      <div className="text-[11px] text-slate-400">{s.year}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {s.hostel_room}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.device ? (
                        <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{s.device.mac_address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          None (Auto-binds on login)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-sky-400 transition"
                        title="Edit student"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.student_id, s.name)}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                        title="Delete student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0c152d] shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingStudent ? `Edit Student: ${editingStudent.student_id}` : 'Create New Student Identity'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    disabled={!!editingStudent}
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    placeholder="e.g. 23CS001"
                    className="w-full px-3 py-2 rounded-lg font-mono border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  University Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@university.edu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year of Study
                  </label>
                  <input
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 3rd Year"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hostel Room
                  </label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Hostel 4, Room 204"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password {editingStudent && '(Leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                >
                  {editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
