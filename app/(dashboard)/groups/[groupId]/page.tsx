'use client'

import { useState, useEffect } from 'react'
import SavingsOverview from '@/components/dashboard/SavingsOverview'
import MemberBalances from '@/components/dashboard/MemberBalances'
import StatementUpload from '@/components/dashboard/StatementUpload'
import Modal from '@/components/ui/Modal'
import type { LedgerEntry, GroupMember, MemberBalance } from '@/types'

export default function GroupDashboard({ params }: { params: { groupId: string } }) {
  const [travelFund, setTravelFund] = useState(0)
  const [interestFund, setInterestFund] = useState(0)
  const [recentEntries, setRecentEntries] = useState<LedgerEntry[]>([])
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [groupName, setGroupName] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const [ledgerRes, membersRes, groupRes] = await Promise.all([
        fetch(`/api/groups/${params.groupId}/ledger`),
        fetch(`/api/groups/${params.groupId}/members`),
        fetch(`/api/groups/${params.groupId}`),
      ])

      const [ledger, membersData, groupData] = await Promise.all([
        ledgerRes.json(),
        membersRes.json(),
        groupRes.json(),
      ])

      setTravelFund(ledger.travelFund ?? 0)
      setInterestFund(ledger.interestFund ?? 0)
      setRecentEntries(ledger.recentEntries ?? [])
      setMemberBalances(ledger.memberBalances ?? [])
      setMembers(membersData.members ?? [])
      setGroupName(groupData.group?.name ?? '')
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.groupId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
      <div className="mb-8">
        <h1 className="page-title">{groupName || 'Savings'}</h1>
        <p className="mt-1 text-sm text-stone-400">Shared travel fund overview</p>
      </div>

      <div className="space-y-6">
        <SavingsOverview
          travelFund={travelFund}
          interestFund={interestFund}
          recentEntries={recentEntries}
          groupId={params.groupId}
          onUploadStatement={() => setShowUpload(true)}
        />

        <MemberBalances balances={memberBalances} />
      </div>

      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Import Bank Statement"
        size="lg"
      >
        <StatementUpload
          groupId={params.groupId}
          members={members}
          onSuccess={() => {
            setShowUpload(false)
            loadData()
          }}
          onClose={() => setShowUpload(false)}
        />
      </Modal>
    </div>
  )
}
