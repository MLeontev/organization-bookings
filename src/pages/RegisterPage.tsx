import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../api/orgMembershipApi';
import { Alert } from '../components/Alert';

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await registerUser({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        patronymic: patronymic.trim() || null,
      });

      setSuccess('Аккаунт создан, теперь можно войти');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPatronymic('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
      <h2 className='text-2xl font-semibold text-slate-900'>Создать аккаунт</h2>

      <div className='mt-4 space-y-3'>
        {error && <Alert tone='error'>{error}</Alert>}
        {success && <Alert tone='success'>{success}</Alert>}
      </div>

      <form className='mt-4 space-y-3' onSubmit={handleSubmit}>
        <input
          className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
          placeholder='Электронная почта'
          type='email'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
          placeholder='Пароль'
          type='password'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <div className='grid gap-3 md:grid-cols-2'>
          <input
            className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
            placeholder='Имя'
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <input
            className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
            placeholder='Фамилия'
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>
        <input
          className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
          placeholder='Отчество (по желанию)'
          value={patronymic}
          onChange={(event) => setPatronymic(event.target.value)}
        />

        <button
          type='submit'
          disabled={loading}
          className='rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300'
        >
          {loading ? 'Создаем аккаунт' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className='mt-4 text-sm text-slate-600'>
        Уже есть аккаунт?{' '}
        <Link to='/' className='font-medium text-sky-700 hover:underline'>
          Войти
        </Link>
      </p>
    </div>
  );
}
