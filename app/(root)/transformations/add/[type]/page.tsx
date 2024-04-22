import React from 'react'
import Header from '@/components/shared/Header'
import { transformationTypes } from '@/constants'
import TransformationForm from '@/components/shared/TransformationForm'
import { getUserById } from '@/lib/actions/user.actions';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

const AddTransformationtypePage = async ({ params: { type } }: SearchParamProps) => {
  const { userId } = auth();

  if(!userId) redirect('/sign-in')

  const user = await getUserById(userId);

  const transformation = transformationTypes[type]
  return (
    <>
      <Header title={transformation.title}
        subtitle={transformation.subTitle}
      />
      <section className='mt-10'>

      <TransformationForm 
          action="Add"
          userId={user._id}
          type={transformation.type as TransformationTypeKey}
          creditBalance={user.creditBalance}
        />
      </section>
    </>
  )
}

export default AddTransformationtypePage
