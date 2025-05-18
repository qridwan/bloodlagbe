import { scrollTop } from '@/utils/scrollTop';
import { useEffect } from 'react';

function useScrollOnMessage(error?: string | null, successMessage?: string | null) {
	useEffect(() => {
		if (error || successMessage) {
			scrollTop();
		}
	}, [error, successMessage]);
}

export default useScrollOnMessage;
