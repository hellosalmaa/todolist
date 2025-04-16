'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string; 
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return '⏰ Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah tugas baru 🎀',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const editTask = async (id: string, currentText: string, currentDeadline: string): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit tugas ✏️',
      html:
        `<input id="swal-input1" class="swal2-input" value="${currentText}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${currentDeadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask = {
        text: formValues[0],
        deadline: formValues[1],
      };
      await updateDoc(doc(db, 'tasks', id), updatedTask);
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, ...updatedTask } : task
        )
      );

      // ✅ Notifikasi berhasil edit
      Swal.fire({
        icon: 'success',
        title: 'Tugas berhasil diubah!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));

    // 🗑️ Notifikasi berhasil hapus
    Swal.fire({
      icon: 'success',
      title: 'Tugas berhasil dihapus!',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-pink-50 shadow-xl rounded-xl font-sans">
      <h1 className="text-3xl text-pink-600 font-extrabold mb-6 text-center">🧁 To-Do List 🧁</h1>
      <p className="text-[#F48FB1] text-center italic mb-4">
        What I do today is a gentle gift for the me I’m becoming ✨
      </p>

      <div className="flex justify-center mb-6">
        <button
          onClick={addTask}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-lg transition duration-200 shadow-md"
        >
          + Tambah Tugas
        </button>
      </div>

      <ul className="space-y-4">
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === '⏰ Waktu habis!';
            const taskColor = task.completed
              ? 'bg-pink-100 border-pink-300'
              : isExpired
              ? 'bg-red-300 border-red-400'
              : 'bg-white border-pink-200';

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`border ${taskColor} p-4 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <motion.span
                      onClick={() => toggleTask(task.id)}
                      className="cursor-pointer text-2xl select-none"
                      whileTap={{ scale: 1.3, rotate: 15 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {task.completed ? '🌸' : '🪻'}
                    </motion.span>

                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`text-lg cursor-pointer ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'text-pink-700 font-semibold'
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => editTask(task.id, task.text, task.deadline)}
                      className="text-xs bg-purple-400 hover:bg-purple-500 text-white px-2 py-1 rounded shadow-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded shadow-sm"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-2">
                  📅 Deadline: {new Date(task.deadline).toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-gray-700 mt-1">
                  ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                </p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
